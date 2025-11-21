import express from 'express';
import cors from 'cors';
import { ConnectionPool } from '../core/connection-pool.js';
import { ConfigEngine } from '../config/config-engine.js';
import { logger } from '../utils/logger.js';

export class ControlPlane {
    private app: express.Application;
    private port: number;
    private connectionPool: ConnectionPool;
    private configEngine: ConfigEngine;

    constructor(port: number, connectionPool: ConnectionPool, configEngine: ConfigEngine) {
        this.port = port;
        this.connectionPool = connectionPool;
        this.configEngine = configEngine;
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());
        this.setupRoutes();
    }

    private setupRoutes() {
        // GET /api/servers
        this.app.get('/api/servers', (req, res) => {
            const clients = this.connectionPool.getAllClients();
            // We need to get the full config to show even disconnected servers
            // But for now, let's just show connected ones or merge with config.
            // Ideally, we should read from ConfigEngine to get all configured servers.
            // Let's assume we want to show all configured servers and their status.

            // This requires ConfigEngine to expose the current config or we load it again.
            // For Phase 2, let's just return what's in the pool for simplicity, 
            // or better, we should probably inject the full config or have ConfigEngine provide it.

            // Let's iterate over the connection pool for now.
            const servers = Array.from(clients.entries()).map(([id, client]) => ({
                id,
                status: 'connected', // TODO: Check actual status if possible
                type: client.constructor.name
            }));
            res.json(servers);
        });

        // POST /api/servers/:id/start
        this.app.post('/api/servers/:id/start', async (req, res) => {
            const { id } = req.params;
            try {
                // We need to get the server config to start it.
                // ConnectionPool needs a method to start a specific server by ID if it has the config.
                // Or we need to load config here.
                // Let's assume ConnectionPool has a `connectServerById` or similar if we pass the config.
                // Actually ConnectionPool.connectServer takes a config.
                // We need access to the full config.

                // For now, just log.
                logger.info({ id }, 'Request to start server');
                res.status(501).json({ error: 'Not implemented yet' });
            } catch (error: any) {
                res.status(500).json({ error: error.message });
            }
        });

        // POST /api/servers/:id/stop
        this.app.post('/api/servers/:id/stop', async (req, res) => {
            const { id } = req.params;
            // TODO: Implement stop in ConnectionPool (it has processManager, but we need to disconnect client too)
            logger.info({ id }, 'Request to stop server');
            res.status(501).json({ error: 'Not implemented yet' });
        });

        // GET /api/logs (SSE)
        this.app.get('/api/logs', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            // TODO: Hook into logger to stream logs
            // For now, send a heartbeat
            const interval = setInterval(() => {
                res.write(`data: ${JSON.stringify({ timestamp: new Date(), message: 'heartbeat' })}\n\n`);
            }, 5000);

            req.on('close', () => {
                clearInterval(interval);
            });
        });
    }

    public start() {
        this.app.listen(this.port, () => {
            logger.info({ port: this.port }, 'Control Plane started');
        });
    }
}
