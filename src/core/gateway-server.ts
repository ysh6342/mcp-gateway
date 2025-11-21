import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    Tool
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { ConnectionPool } from './connection-pool.js';
import { SmartRouter } from './router.js';

export class GatewayServer {
    private server: Server;
    private connectionPool: ConnectionPool;
    private router: SmartRouter;

    constructor(connectionPool: ConnectionPool, router: SmartRouter) {
        this.connectionPool = connectionPool;
        this.router = router;

        this.server = new Server(
            {
                name: 'mcp-gateway',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools: Tool[] = [];
            for (const [id, client] of this.connectionPool.getAllClients()) {
                try {
                    const result = await client.listTools();
                    tools.push(...result.tools);
                } catch (err) {
                    logger.warn({ id, err }, 'Failed to list tools from client');
                }
            }
            return { tools };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            logger.info({ tool: request.params.name }, 'Received tool call request');
            try {
                const result = await this.router.routeToolCall(request.params.name, request.params.arguments);
                return result;
            } catch (error: any) {
                logger.error({ tool: request.params.name, err: error }, 'Tool call failed');
                throw error;
            }
        });

        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            return { resources: [] };
        });

        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            throw new Error('Not implemented');
        });

        this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
            return { prompts: [] };
        });

        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            throw new Error('Not implemented');
        });
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        logger.info('Gateway Server started on Stdio');
    }
}
