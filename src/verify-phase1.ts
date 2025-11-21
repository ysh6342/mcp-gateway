import { GatewayServer } from './core/gateway-server.js';
import { ConnectionPool } from './core/connection-pool.js';
import { ProcessManager } from './core/process-manager.js';
import { SmartRouter } from './core/router.js';
import { ConfigEngine } from './config/config-engine.js';
import { logger } from './utils/logger.js';
import { ServerConfig } from './config/schema.js';

async function main() {
    logger.info('Starting Phase 1 Verification...');

    // 1. Setup Components
    const processManager = new ProcessManager();
    const connectionPool = new ConnectionPool(processManager);
    const router = new SmartRouter(connectionPool);
    const gatewayServer = new GatewayServer(connectionPool, router);

    // 2. Load Config
    const configEngine = new ConfigEngine('verify-phase1.json');
    const config = await configEngine.load();

    // Add a test local server if missing
    if (config.servers.length === 0) {
        config.servers.push({
            id: 'local-echo',
            name: 'Local Echo Server',
            command: 'node',
            transport: 'stdio',
            restartPolicy: {
                mode: 'on-failure',
                maxRetries: 3,
                backoffBase: 1000
            },
            args: ['-e', `
        const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
        const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
        const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

        const server = new Server({ name: 'echo', version: '1.0' }, { capabilities: { tools: {} } });

        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [{ name: 'echo', description: 'Echoes back input', inputSchema: { type: 'object' } }]
        }));

        server.setRequestHandler(CallToolRequestSchema, async (req) => {
            if (req.params.name === 'echo') return { content: [{ type: 'text', text: JSON.stringify(req.params.arguments) }] };
            throw new Error('Tool not found');
        });

        const transport = new StdioServerTransport();
        server.connect(transport);
      `],
            enabled: true,
        });
        await configEngine.save(config);
    }

    // 3. Initialize Connection Pool
    await connectionPool.initialize(config);

    // 4. Verify Local Connection
    const client = connectionPool.getClient('local-echo');
    if (!client) {
        throw new Error('Failed to connect to local-echo server');
    }
    logger.info('Connected to local-echo server');

    // 5. Test Tool Call via Router
    try {
        const result = await router.routeToolCall('echo', { message: 'Hello MCP' });
        logger.info({ result }, 'Tool call result');

        if (!result) throw new Error('Tool call returned no result');

        const content = (result as any).content[0].text;
        if (content.includes('Hello MCP')) {
            logger.info('Verification Passed: Echo received');
        } else {
            throw new Error(`Unexpected result: ${content}`);
        }

    } catch (error) {
        logger.error({ err: error }, 'Tool call failed');
        throw error;
    }

    // 6. Cleanup
    await processManager.stopAll();
    logger.info('Verification Complete');
}

main().catch(err => {
    logger.error({ err }, 'Verification Failed');
    process.exit(1);
});
