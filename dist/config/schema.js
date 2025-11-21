"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayConfigSchema = exports.ServerConfigSchema = exports.RestartPolicySchema = exports.SecuritySchema = void 0;
const zod_1 = require("zod");
// 1. Security & Sandboxing
exports.SecuritySchema = zod_1.z.object({
    allowedPaths: zod_1.z.array(zod_1.z.string()).optional(),
    deniedPaths: zod_1.z.array(zod_1.z.string()).optional(),
    maxRequestsPerMinute: zod_1.z.number().optional(),
});
// 2. Restart Policy
exports.RestartPolicySchema = zod_1.z.object({
    mode: zod_1.z.enum(['always', 'on-failure', 'never']).default('on-failure'),
    maxRetries: zod_1.z.number().default(3),
    backoffBase: zod_1.z.number().default(1000), // ms
});
// 3. Individual Server Config
exports.ServerConfigSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[a-z0-9-_]+$/),
    name: zod_1.z.string(),
    command: zod_1.z.string().optional(), // Optional for remote
    args: zod_1.z.array(zod_1.z.string()).default([]),
    env: zod_1.z.record(zod_1.z.string()).optional(),
    cwd: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(false),
    // Transport configuration
    transport: zod_1.z.enum(['stdio', 'sse']).default('stdio'),
    url: zod_1.z.string().url().optional(),
    // Namespace for tool collision avoidance
    namespace: zod_1.z.string().optional(),
    security: exports.SecuritySchema.optional(),
    restartPolicy: exports.RestartPolicySchema.default({}),
}).refine(data => {
    if (data.transport === 'sse' && !data.url) {
        return false;
    }
    if (data.transport === 'stdio' && !data.command) {
        return false;
    }
    return true;
}, {
    message: "URL is required for SSE transport, Command is required for Stdio transport",
    path: ["url", "command"]
});
// 4. Root Config
exports.GatewayConfigSchema = zod_1.z.object({
    servers: zod_1.z.array(exports.ServerConfigSchema).default([]),
});
