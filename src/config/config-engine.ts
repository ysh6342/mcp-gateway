import fs from 'fs/promises';
import path from 'path';
import { GatewayConfig, GatewayConfigSchema } from './schema.js';
import { logger } from '../utils/logger.js';

export class ConfigEngine {
    private configPath: string;
    private config: GatewayConfig | null = null;

    constructor(configPath: string = 'servers.json') {
        this.configPath = path.resolve(process.cwd(), configPath);
    }

    async load(): Promise<GatewayConfig> {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const json = JSON.parse(data);
            const result = GatewayConfigSchema.safeParse(json);

            if (!result.success) {
                logger.error({ errors: result.error.errors }, 'Invalid configuration file');
                throw new Error('Invalid configuration file');
            }

            this.config = result.data;
            logger.info({ path: this.configPath }, 'Configuration loaded successfully');
            return this.config;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                logger.warn({ path: this.configPath }, 'Configuration file not found, creating default');
                const defaultConfig: GatewayConfig = { servers: [] };
                await this.save(defaultConfig);
                return defaultConfig;
            }
            logger.error({ err: error }, 'Failed to load configuration');
            throw error;
        }
    }

    async save(config: GatewayConfig): Promise<void> {
        try {
            const result = GatewayConfigSchema.safeParse(config);
            if (!result.success) {
                throw new Error('Invalid configuration data');
            }

            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
            this.config = config;
            logger.info('Configuration saved successfully');
        } catch (error) {
            logger.error({ err: error }, 'Failed to save configuration');
            throw error;
        }
    }

    getConfig(): GatewayConfig | null {
        return this.config;
    }
}
