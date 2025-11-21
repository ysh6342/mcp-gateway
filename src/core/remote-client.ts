import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { ServerConfig } from '../config/schema.js';
import { logger } from '../utils/logger.js';
import EventSource from 'eventsource';

// Polyfill EventSource for Node.js
global.EventSource = EventSource as any;

export class RemoteClient {
    private client: Client;
    private transport: SSEClientTransport | null = null;
    private config: ServerConfig;

    constructor(config: ServerConfig) {
        this.config = config;
        this.client = new Client(
            {
                name: 'mcp-gateway-client',
                version: '0.1.0',
            },
            {
                capabilities: {},
            }
        );
    }

    async connect(): Promise<void> {
        if (!this.config.url) {
            throw new Error('URL is required for SSE transport');
        }

        logger.info({ id: this.config.id, url: this.config.url }, 'Connecting to remote MCP server');

        try {
            this.transport = new SSEClientTransport(new URL(this.config.url));
            await this.client.connect(this.transport);
            logger.info({ id: this.config.id }, 'Connected to remote MCP server');
        } catch (error) {
            logger.error({ id: this.config.id, err: error }, 'Failed to connect to remote MCP server');
            throw error;
        }
    }

    async listTools() {
        return this.client.listTools();
    }

    async callTool(name: string, args: any) {
        return this.client.callTool({
            name,
            arguments: args,
        });
    }

    async close() {
        if (this.transport) {
            // SSE transport might not have a close method exposed directly in all versions, 
            // but client.close() should handle it if supported.
            // For SSE, we might need to manually close the EventSource if the SDK doesn't.
            // Checking SDK implementation... assuming client.close() is sufficient for now.
            await this.client.close();
        }
    }
}
