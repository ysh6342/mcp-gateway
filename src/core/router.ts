import { ConnectionPool } from './connection-pool.js';
import { logger } from '../utils/logger.js';

export class SmartRouter {
    private connectionPool: ConnectionPool;

    constructor(connectionPool: ConnectionPool) {
        this.connectionPool = connectionPool;
    }

    async routeToolCall(toolName: string, args: any): Promise<any> {
        const clients = this.connectionPool.getAllClients();

        for (const [id, client] of clients) {
            try {
                // SDK 타입 문제 우회를 위해 any 사용
                const result = await (client as any).callTool({
                    name: toolName,
                    arguments: args
                });
                logger.info({ tool: toolName, server: id }, 'Tool call successful');
                return result;
            } catch (error: any) {
                if (error.message && error.message.includes('not found')) {
                    continue;
                }
                logger.debug({ tool: toolName, server: id, err: error }, 'Tool call failed on server');
            }
        }

        throw new Error(`Tool ${toolName} not found on any active server`);
    }
}
