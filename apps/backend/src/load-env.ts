import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_PATH = resolve(__dirname, '../../../.env');

const REQUIRED_ENV = [
    'ALLOWED_ORIGIN',
    'APPLICATION_PORT',
    'POSTGRES_URI',
    'REDIS_URI',
    'JWT_ACCESS_SECRET',
    'JWT_ACCESS_TTL',
    'JWT_REFRESH_TTL',
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_FROM',
];

export function loadRootEnv(): void {
    if (!existsSync(ENV_PATH)) {
        return;
    }

    try {
        process.loadEnvFile(ENV_PATH);
    } catch (error) {
        throw new Error(
            `Failed to read ${ENV_PATH}: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export function assertRequiredEnv(): void {
    const missing = REQUIRED_ENV.filter(key => !process.env[key]);

    if (missing.length === 0) {
        return;
    }

    const reason = existsSync(ENV_PATH)
        ? `They are missing from ${ENV_PATH} and from the environment.`
        : `No .env file at ${ENV_PATH}: copy .env.example to .env and fill it in.`;

    throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ${reason}`,
    );
}
