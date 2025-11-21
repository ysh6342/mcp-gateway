import { execa, ResultPromise } from 'execa';
import { ServerConfig } from '../config/schema.js';
import { logger } from '../utils/logger.js';

export class ProcessManager {
    private processes: Map<string, ResultPromise> = new Map();

    async spawnServer(serverConfig: ServerConfig): Promise<void> {
        if (this.processes.has(serverConfig.id)) {
            logger.warn({ id: serverConfig.id }, 'Server process already exists');
            return;
        }

        logger.info({ id: serverConfig.id, cmd: serverConfig.command }, 'Spawning server process');

        try {
            const subprocess = execa(serverConfig.command!, serverConfig.args, {
                env: { ...process.env, ...serverConfig.env },
                cwd: serverConfig.cwd || process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                cleanup: true,
            });

            this.processes.set(serverConfig.id, subprocess);

            subprocess.on('spawn', () => {
                logger.info({ id: serverConfig.id, pid: subprocess.pid }, 'Server process spawned');
            });

            subprocess.on('error', (err: any) => {
                logger.error({ id: serverConfig.id, err }, 'Server process error');
            });

            subprocess.on('exit', (code: any, signal: any) => {
                logger.info({ id: serverConfig.id, code, signal }, 'Server process exited');
                this.processes.delete(serverConfig.id);
            });

        } catch (error) {
            logger.error({ id: serverConfig.id, err: error }, 'Failed to spawn server process');
            throw error;
        }
    }

    async stop(id: string): Promise<void> {
        const subprocess = this.processes.get(id);
        if (!subprocess) {
            logger.warn({ id }, 'Server process not found for stopping');
            return;
        }

        logger.info({ id }, 'Stopping server process');
        subprocess.kill('SIGTERM');
        this.processes.delete(id);
    }

    async stopAll(): Promise<void> {
        logger.info('Stopping all server processes');
        for (const [id, process] of this.processes) {
            logger.info({ id }, 'Stopping server process');
            process.kill('SIGTERM');
        }
        this.processes.clear();
    }

    getProcess(id: string): ResultPromise | undefined {
        return this.processes.get(id);
    }
}
