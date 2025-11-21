import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import { logger } from '../utils/logger.js';

export class PipeTransport implements Transport {
    private _input: Readable;
    private _output: Writable;
    private _started: boolean = false;

    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;

    constructor(input: Readable, output: Writable) {
        this._input = input;
        this._output = output;
    }

    async start(): Promise<void> {
        if (this._started) return;
        this._started = true;

        this._input.on('data', (chunk) => {
            try {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const message = JSON.parse(line);
                        this.onmessage?.(message);
                    } catch (e) {
                        // Ignore non-JSON lines (maybe logs)
                        // logger.debug({ line }, 'Received non-JSON output from server');
                    }
                }
            } catch (error: any) {
                this.onerror?.(error);
            }
        });

        this._input.on('close', () => {
            this.onclose?.();
        });

        this._input.on('error', (error) => {
            this.onerror?.(error);
        });
    }

    async send(message: JSONRPCMessage): Promise<void> {
        if (!this._started) throw new Error('Transport not started');
        const json = JSON.stringify(message);
        this._output.write(json + '\n');
    }

    async close(): Promise<void> {
        // We don't close the streams here because ProcessManager owns them.
        // But we can emit close.
        this.onclose?.();
    }
}
