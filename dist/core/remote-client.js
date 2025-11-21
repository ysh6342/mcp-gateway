"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteClient = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/client/sse.js");
const logger_js_1 = require("../utils/logger.js");
const eventsource_1 = __importDefault(require("eventsource"));
// Polyfill EventSource for Node.js
global.EventSource = eventsource_1.default;
class RemoteClient {
    client;
    transport = null;
    config;
    constructor(config) {
        this.config = config;
        this.client = new index_js_1.Client({
            name: 'mcp-gateway-client',
            version: '0.1.0',
        }, {
            capabilities: {},
        });
    }
    async connect() {
        if (!this.config.url) {
            throw new Error('URL is required for SSE transport');
        }
        logger_js_1.logger.info({ id: this.config.id, url: this.config.url }, 'Connecting to remote MCP server');
        try {
            this.transport = new sse_js_1.SSEClientTransport(new URL(this.config.url));
            await this.client.connect(this.transport);
            logger_js_1.logger.info({ id: this.config.id }, 'Connected to remote MCP server');
        }
        catch (error) {
            logger_js_1.logger.error({ id: this.config.id, err: error }, 'Failed to connect to remote MCP server');
            throw error;
        }
    }
    async listTools() {
        return this.client.listTools();
    }
    async callTool(name, args) {
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
exports.RemoteClient = RemoteClient;
