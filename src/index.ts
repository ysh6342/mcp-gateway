import { GatewayServer } from './core/gateway-server.js';
import { ConnectionPool } from './core/connection-pool.js';
import { ProcessManager } from './core/process-manager.js';
import { SmartRouter } from './core/router.js';
import { ConfigEngine } from './config/config-engine.js';
import { ControlPlane } from './api/control-plane.js';
import { ConfigWatcher } from './core/config-watcher.js';
import { logger } from './utils/logger.js';

async function main() {
    logger.info('Starting MCP Gateway...');

    // 1. Load Config
    const configEngine = new ConfigEngine('gateway-config.json');
    const config = await configEngine.load();
    logger.info({ config }, 'Config loaded');

    // 2. Initialize Components
    const processManager = new ProcessManager();
    const connectionPool = new ConnectionPool(processManager);
    const router = new SmartRouter(connectionPool);
    const gatewayServer = new GatewayServer(connectionPool, router);
    const controlPlane = new ControlPlane(3001, connectionPool, configEngine);

    // 3. Setup Hot Reloading
    const configWatcher = new ConfigWatcher('gateway-config.json', async (newConfig) => {
        await connectionPool.reload(newConfig);
    });
    configWatcher.start();

    // 4. Start Services
    await connectionPool.initialize(config);
    await gatewayServer.start();
    controlPlane.start();

    logger.info('MCP Gateway is running with hot reloading enabled');

    // 5. Graceful Shutdown
    process.on('SIGINT', async () => {
        logger.info('Shutting down...');
        configWatcher.stop();
        await processManager.stopAll();
        process.exit(0);
    });
}

main().catch(err => {
    logger.error({ err }, 'Fatal error');
    process.exit(1);
});
