"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const logger_js_1 = require("../utils/logger.js");
class GatewayServer {
    server;
    connectionPool;
    router;
    constructor(connectionPool, router) {
        this.connectionPool = connectionPool;
        this.router = router;
        this.server = new index_js_1.Server({
            name: 'mcp-gateway',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            const tools = [];
            for (const [id, client] of this.connectionPool.getAllClients()) {
                try {
                    const result = await client.listTools();
                    tools.push(...result.tools);
                }
                catch (err) {
                    logger_js_1.logger.warn({ id, err }, 'Failed to list tools from client');
                }
            }
            return { tools };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            logger_js_1.logger.info({ tool: request.params.name }, 'Received tool call request');
            try {
                const result = await this.router.routeToolCall(request.params.name, request.params.arguments);
                return result;
            }
            catch (error) {
                logger_js_1.logger.error({ tool: request.params.name, err: error }, 'Tool call failed');
                throw error;
            }
        });
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            return { resources: [] };
        });
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            throw new Error('Not implemented');
        });
        this.server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => {
            return { prompts: [] };
        });
        this.server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
            throw new Error('Not implemented');
        });
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        logger_js_1.logger.info('Gateway Server started on Stdio');
    }
}
exports.GatewayServer = GatewayServer;
