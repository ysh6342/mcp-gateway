import chokidar, { FSWatcher } from 'chokidar';
import { logger } from '../utils/logger.js';
import { GatewayConfig } from '../config/schema.js';

export class ConfigWatcher {
    private watcher: FSWatcher | null = null;
    private configPath: string;
    private onChangeCallback: (config: GatewayConfig) => void;
    private debounceTimer: NodeJS.Timeout | null = null;
    private debounceMs: number = 1000;

    constructor(configPath: string, onChangeCallback: (config: GatewayConfig) => void) {
        this.configPath = configPath;
        this.onChangeCallback = onChangeCallback;
    }

    start() {
        this.watcher = chokidar.watch(this.configPath, {
            persistent: true,
            ignoreInitial: true,
        });

        this.watcher.on('change', (path: string) => {
            logger.info({ path }, 'Config file changed, reloading...');
            this.handleChange();
        });

        logger.info({ path: this.configPath }, 'Config watcher started');
    }

    private handleChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(async () => {
            try {
                const fs = await import('fs/promises');
                const content = await fs.readFile(this.configPath, 'utf-8');
                const config = JSON.parse(content);
                this.onChangeCallback(config);
                logger.info('Config reloaded successfully');
            } catch (error: any) {
                logger.error({ err: error }, 'Failed to reload config');
            }
        }, this.debounceMs);
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            logger.info('Config watcher stopped');
        }
    }
}
