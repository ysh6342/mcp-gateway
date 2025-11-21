import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ServerConfig, GatewayConfig } from '../config/schema.js';
import { ProcessManager } from './process-manager.js';
import { RemoteClient } from './remote-client.js';
import { PipeTransport } from './pipe-transport.js';
import { logger } from '../utils/logger.js';

type MCPClient = Client | RemoteClient;

export class ConnectionPool {
    private clients: Map<string, MCPClient> = new Map();
    private processManager: ProcessManager;

    constructor(processManager: ProcessManager) {
        this.processManager = processManager;
    }

    async initialize(config: GatewayConfig) {
        for (const serverConfig of config.servers) {
            if (!serverConfig.enabled) continue;
            await this.connectServer(serverConfig);
        }
    }

    async connectServer(config: ServerConfig) {
        try {
            if (config.transport === 'stdio') {
                await this.connectLocalServer(config);
            } else if (config.transport === 'sse') {
                await this.connectRemoteServer(config);
            }
        } catch (error) {
            logger.error({ id: config.id, err: error }, 'Failed to connect server');
        }
    }

    private async connectLocalServer(config: ServerConfig) {
        // 1. Spawn process
        await this.processManager.spawnServer(config);

        // 2. Connect Client via Stdio
        const process = this.processManager.getProcess(config.id);
        if (!process) {
            throw new Error(`Process ${config.id} not found`);
        }

        const transport = new PipeTransport(
            process.stdout!,
            process.stdin!
        );

        const client = new Client(
            { name: 'mcp-gateway-client', version: '0.1.0' },
            { capabilities: {} }
        );

        await client.connect(transport);
        this.clients.set(config.id, client);
        logger.info({ id: config.id }, 'Local MCP client connected');
    }

    private async connectRemoteServer(config: ServerConfig) {
        const client = new RemoteClient(config);
        await client.connect();
        this.clients.set(config.id, client);
    }

    getClient(id: string): MCPClient | undefined {
        return this.clients.get(id);
    }

    getAllClients(): Map<string, MCPClient> {
        return this.clients;
    }
    async reload(newConfig: GatewayConfig) {
        logger.info('Reloading configuration...');

        const currentIds = new Set(this.clients.keys());
        const newIds = new Set(newConfig.servers.filter(s => s.enabled).map(s => s.id));

        // 1. 삭제된 서버 정리
        for (const id of currentIds) {
            if (!newIds.has(id)) {
                logger.info({ id }, 'Removing server');
                this.clients.delete(id);
                await this.processManager.stop(id);
            }
        }

        // 2. 새 서버 추가 또는 기존 서버 재시작
        for (const serverConfig of newConfig.servers) {
            if (!serverConfig.enabled) continue;

            if (currentIds.has(serverConfig.id)) {
                // 기존 서버 재시작 (설정이 변경되었을 수 있음)
                logger.info({ id: serverConfig.id }, 'Restarting server');
                this.clients.delete(serverConfig.id);
                await this.processManager.stop(serverConfig.id);
                await this.connectServer(serverConfig);
            } else {
                // 새 서버 추가
                logger.info({ id: serverConfig.id }, 'Adding new server');
                await this.connectServer(serverConfig);
            }
        }

        logger.info('Configuration reloaded successfully');
    }
}
