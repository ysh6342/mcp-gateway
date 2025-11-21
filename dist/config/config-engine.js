"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigEngine = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const schema_js_1 = require("./schema.js");
const logger_js_1 = require("../utils/logger.js");
class ConfigEngine {
    configPath;
    config = null;
    constructor(configPath = 'servers.json') {
        this.configPath = path_1.default.resolve(process.cwd(), configPath);
    }
    async load() {
        try {
            const data = await promises_1.default.readFile(this.configPath, 'utf-8');
            const json = JSON.parse(data);
            const result = schema_js_1.GatewayConfigSchema.safeParse(json);
            if (!result.success) {
                logger_js_1.logger.error({ errors: result.error.errors }, 'Invalid configuration file');
                throw new Error('Invalid configuration file');
            }
            this.config = result.data;
            logger_js_1.logger.info({ path: this.configPath }, 'Configuration loaded successfully');
            return this.config;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                logger_js_1.logger.warn({ path: this.configPath }, 'Configuration file not found, creating default');
                const defaultConfig = { servers: [] };
                await this.save(defaultConfig);
                return defaultConfig;
            }
            logger_js_1.logger.error({ err: error }, 'Failed to load configuration');
            throw error;
        }
    }
    async save(config) {
        try {
            const result = schema_js_1.GatewayConfigSchema.safeParse(config);
            if (!result.success) {
                throw new Error('Invalid configuration data');
            }
            await promises_1.default.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
            this.config = config;
            logger_js_1.logger.info('Configuration saved successfully');
        }
        catch (error) {
            logger_js_1.logger.error({ err: error }, 'Failed to save configuration');
            throw error;
        }
    }
    getConfig() {
        return this.config;
    }
}
exports.ConfigEngine = ConfigEngine;
