"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionPool = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const remote_client_js_1 = require("./remote-client.js");
const pipe_transport_js_1 = require("./pipe-transport.js");
const logger_js_1 = require("../utils/logger.js");
class ConnectionPool {
    clients = new Map();
    processManager;
    constructor(processManager) {
        this.processManager = processManager;
    }
    async initialize(config) {
        for (const serverConfig of config.servers) {
            if (!serverConfig.enabled)
                continue;
            await this.connectServer(serverConfig);
        }
    }
    async connectServer(config) {
        try {
            if (config.transport === 'stdio') {
                await this.connectLocalServer(config);
            }
            else if (config.transport === 'sse') {
                await this.connectRemoteServer(config);
            }
        }
        catch (error) {
            logger_js_1.logger.error({ id: config.id, err: error }, 'Failed to connect server');
        }
    }
    async connectLocalServer(config) {
        // 1. Spawn process
        await this.processManager.spawnServer(config);
        // 2. Connect Client via Stdio
        const process = this.processManager.getProcess(config.id);
        if (!process) {
            throw new Error(`Process ${config.id} not found`);
        }
        const transport = new pipe_transport_js_1.PipeTransport(process.stdout, process.stdin);
        const client = new index_js_1.Client({ name: 'mcp-gateway-client', version: '0.1.0' }, { capabilities: {} });
        await client.connect(transport);
        this.clients.set(config.id, client);
        logger_js_1.logger.info({ id: config.id }, 'Local MCP client connected');
    }
    async connectRemoteServer(config) {
        const client = new remote_client_js_1.RemoteClient(config);
        await client.connect();
        this.clients.set(config.id, client);
    }
    getClient(id) {
        return this.clients.get(id);
    }
    getAllClients() {
        return this.clients;
    }
    async reload(newConfig) {
        logger_js_1.logger.info('Reloading configuration...');
        const currentIds = new Set(this.clients.keys());
        const newIds = new Set(newConfig.servers.filter(s => s.enabled).map(s => s.id));
        // 1. 삭제된 서버 정리
        for (const id of currentIds) {
            if (!newIds.has(id)) {
                logger_js_1.logger.info({ id }, 'Removing server');
                this.clients.delete(id);
                await this.processManager.stop(id);
            }
        }
        // 2. 새 서버 추가 또는 기존 서버 재시작
        for (const serverConfig of newConfig.servers) {
            if (!serverConfig.enabled)
                continue;
            if (currentIds.has(serverConfig.id)) {
                // 기존 서버 재시작 (설정이 변경되었을 수 있음)
                logger_js_1.logger.info({ id: serverConfig.id }, 'Restarting server');
                this.clients.delete(serverConfig.id);
                await this.processManager.stop(serverConfig.id);
                await this.connectServer(serverConfig);
            }
            else {
                // 새 서버 추가
                logger_js_1.logger.info({ id: serverConfig.id }, 'Adding new server');
                await this.connectServer(serverConfig);
            }
        }
        logger_js_1.logger.info('Configuration reloaded successfully');
    }
}
exports.ConnectionPool = ConnectionPool;
