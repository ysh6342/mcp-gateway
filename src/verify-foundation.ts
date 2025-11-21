import { ConfigEngine } from './config/config-engine.js';
import { ProcessManager } from './core/process-manager.js';
import { logger } from './utils/logger.js';

async function main() {
    logger.info('Starting verification...');

    // 1. Test ConfigEngine
    const configEngine = new ConfigEngine('verify-config.json');
    const config = await configEngine.load();
    logger.info({ config }, 'Config loaded');

    // Add a dummy server to config if empty
    if (config.servers.length === 0) {
        config.servers.push({
            id: 'test-server',
            name: 'Test Server',
            command: 'node',
            args: ['-e', 'setInterval(() => console.log("Test server running..."), 1000)'],
            enabled: true,
            transport: 'stdio',
            restartPolicy: {
                mode: 'on-failure',
                maxRetries: 3,
                backoffBase: 1000
            }
        });
        await configEngine.save(config);
        logger.info('Saved test config');
    }

    // 2. Test ProcessManager
    const processManager = new ProcessManager();
    const testServer = config.servers[0];

    if (testServer) {
        await processManager.spawnServer(testServer);

        // Let it run for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        await processManager.stop(testServer.id);
    }

    logger.info('Verification complete.');
}

main().catch(err => {
    logger.error({ err }, 'Verification failed');
    process.exit(1);
});
