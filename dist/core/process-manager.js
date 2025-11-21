"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessManager = void 0;
const execa_1 = require("execa");
const logger_js_1 = require("../utils/logger.js");
class ProcessManager {
    processes = new Map();
    async spawnServer(serverConfig) {
        if (this.processes.has(serverConfig.id)) {
            logger_js_1.logger.warn({ id: serverConfig.id }, 'Server process already exists');
            return;
        }
        logger_js_1.logger.info({ id: serverConfig.id, cmd: serverConfig.command }, 'Spawning server process');
        try {
            const subprocess = (0, execa_1.execa)(serverConfig.command, serverConfig.args, {
                env: { ...process.env, ...serverConfig.env },
                cwd: serverConfig.cwd || process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                cleanup: true,
            });
            this.processes.set(serverConfig.id, subprocess);
            subprocess.on('spawn', () => {
                logger_js_1.logger.info({ id: serverConfig.id, pid: subprocess.pid }, 'Server process spawned');
            });
            subprocess.on('error', (err) => {
                logger_js_1.logger.error({ id: serverConfig.id, err }, 'Server process error');
            });
            subprocess.on('exit', (code, signal) => {
                logger_js_1.logger.info({ id: serverConfig.id, code, signal }, 'Server process exited');
                this.processes.delete(serverConfig.id);
            });
        }
        catch (error) {
            logger_js_1.logger.error({ id: serverConfig.id, err: error }, 'Failed to spawn server process');
            throw error;
        }
    }
    async stop(id) {
        const subprocess = this.processes.get(id);
        if (!subprocess) {
            logger_js_1.logger.warn({ id }, 'Server process not found for stopping');
            return;
        }
        logger_js_1.logger.info({ id }, 'Stopping server process');
        subprocess.kill('SIGTERM');
        this.processes.delete(id);
    }
    async stopAll() {
        logger_js_1.logger.info('Stopping all server processes');
        for (const [id, process] of this.processes) {
            logger_js_1.logger.info({ id }, 'Stopping server process');
            process.kill('SIGTERM');
        }
        this.processes.clear();
    }
    getProcess(id) {
        return this.processes.get(id);
    }
}
exports.ProcessManager = ProcessManager;
