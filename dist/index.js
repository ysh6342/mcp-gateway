"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gateway_server_js_1 = require("./core/gateway-server.js");
const connection_pool_js_1 = require("./core/connection-pool.js");
const process_manager_js_1 = require("./core/process-manager.js");
const router_js_1 = require("./core/router.js");
const config_engine_js_1 = require("./config/config-engine.js");
const control_plane_js_1 = require("./api/control-plane.js");
const config_watcher_js_1 = require("./core/config-watcher.js");
const logger_js_1 = require("./utils/logger.js");
async function main() {
    logger_js_1.logger.info('Starting MCP Gateway...');
    // 1. Load Config
    const configEngine = new config_engine_js_1.ConfigEngine('gateway-config.json');
    const config = await configEngine.load();
    logger_js_1.logger.info({ config }, 'Config loaded');
    // 2. Initialize Components
    const processManager = new process_manager_js_1.ProcessManager();
    const connectionPool = new connection_pool_js_1.ConnectionPool(processManager);
    const router = new router_js_1.SmartRouter(connectionPool);
    const gatewayServer = new gateway_server_js_1.GatewayServer(connectionPool, router);
    const controlPlane = new control_plane_js_1.ControlPlane(3001, connectionPool, configEngine);
    // 3. Setup Hot Reloading
    const configWatcher = new config_watcher_js_1.ConfigWatcher('gateway-config.json', async (newConfig) => {
        await connectionPool.reload(newConfig);
    });
    configWatcher.start();
    // 4. Start Services
    await connectionPool.initialize(config);
    await gatewayServer.start();
    controlPlane.start();
    logger_js_1.logger.info('MCP Gateway is running with hot reloading enabled');
    // 5. Graceful Shutdown
    process.on('SIGINT', async () => {
        logger_js_1.logger.info('Shutting down...');
        configWatcher.stop();
        await processManager.stopAll();
        process.exit(0);
    });
}
main().catch(err => {
    logger_js_1.logger.error({ err }, 'Fatal error');
    process.exit(1);
});
