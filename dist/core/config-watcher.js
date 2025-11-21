"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigWatcher = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const logger_js_1 = require("../utils/logger.js");
class ConfigWatcher {
    watcher = null;
    configPath;
    onChangeCallback;
    debounceTimer = null;
    debounceMs = 1000;
    constructor(configPath, onChangeCallback) {
        this.configPath = configPath;
        this.onChangeCallback = onChangeCallback;
    }
    start() {
        this.watcher = chokidar_1.default.watch(this.configPath, {
            persistent: true,
            ignoreInitial: true,
        });
        this.watcher.on('change', (path) => {
            logger_js_1.logger.info({ path }, 'Config file changed, reloading...');
            this.handleChange();
        });
        logger_js_1.logger.info({ path: this.configPath }, 'Config watcher started');
    }
    handleChange() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(async () => {
            try {
                const fs = await import('fs/promises');
                const content = await fs.readFile(this.configPath, 'utf-8');
                const config = JSON.parse(content);
                this.onChangeCallback(config);
                logger_js_1.logger.info('Config reloaded successfully');
            }
            catch (error) {
                logger_js_1.logger.error({ err: error }, 'Failed to reload config');
            }
        }, this.debounceMs);
    }
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            logger_js_1.logger.info('Config watcher stopped');
        }
    }
}
exports.ConfigWatcher = ConfigWatcher;
