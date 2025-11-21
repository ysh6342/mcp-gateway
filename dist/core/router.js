"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartRouter = void 0;
const logger_js_1 = require("../utils/logger.js");
class SmartRouter {
    connectionPool;
    constructor(connectionPool) {
        this.connectionPool = connectionPool;
    }
    async routeToolCall(toolName, args) {
        const clients = this.connectionPool.getAllClients();
        for (const [id, client] of clients) {
            try {
                // SDK 타입 문제 우회를 위해 any 사용
                const result = await client.callTool({
                    name: toolName,
                    arguments: args
                });
                logger_js_1.logger.info({ tool: toolName, server: id }, 'Tool call successful');
                return result;
            }
            catch (error) {
                if (error.message && error.message.includes('not found')) {
                    continue;
                }
                logger_js_1.logger.debug({ tool: toolName, server: id, err: error }, 'Tool call failed on server');
            }
        }
        throw new Error(`Tool ${toolName} not found on any active server`);
    }
}
exports.SmartRouter = SmartRouter;
