import { z } from 'zod';

// 1. Security & Sandboxing
export const SecuritySchema = z.object({
    allowedPaths: z.array(z.string()).optional(),
    deniedPaths: z.array(z.string()).optional(),
    maxRequestsPerMinute: z.number().optional(),
});

// 2. Restart Policy
export const RestartPolicySchema = z.object({
    mode: z.enum(['always', 'on-failure', 'never']).default('on-failure'),
    maxRetries: z.number().default(3),
    backoffBase: z.number().default(1000), // ms
});

// 3. Individual Server Config
export const ServerConfigSchema = z.object({
    id: z.string().regex(/^[a-z0-9-_]+$/),
    name: z.string(),
    command: z.string().optional(), // Optional for remote
    args: z.array(z.string()).default([]),
    env: z.record(z.string()).optional(),
    cwd: z.string().optional(),

    enabled: z.boolean().default(false),

    // Transport configuration
    transport: z.enum(['stdio', 'sse']).default('stdio'),
    url: z.string().url().optional(),

    // Namespace for tool collision avoidance
    namespace: z.string().optional(),

    security: SecuritySchema.optional(),
    restartPolicy: RestartPolicySchema.default({}),
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

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// 4. Root Config
export const GatewayConfigSchema = z.object({
    servers: z.array(ServerConfigSchema).default([]),
});

export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
