import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Корневой .env: файл лежит на три уровня выше src/ и dist/. */
const ENV_PATH = resolve(__dirname, '../../../.env');

/**
 * Переменные, без которых приложение не поднимется ни в одном режиме.
 * Условно обязательные тут не перечислены: GOOGLE_* нужны только при
 * заполненном GOOGLE_CLIENT_ID, TURNSTILE_SECRET_KEY — при TURNSTILE_ENABLED,
 * MAIL_USER/MAIL_PASSWORD — только если у SMTP есть авторизация.
 */
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
    // Файла может не быть намеренно: в проде переменные приходят из окружения.
    if (!existsSync(ENV_PATH)) {
        return;
    }

    try {
        process.loadEnvFile(ENV_PATH);
    } catch (error) {
        // А вот битый .env глотать нельзя: дальше всё развалится непонятно где.
        throw new Error(
            `Failed to read ${ENV_PATH}: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Раньше пропущенная переменная всплывала первой же `getOrThrow` где-то внутри
 * DI: сообщение «Configuration key "MAIL_HOST" does not exist» не говорило ни
 * про .env, ни про остальные пропущенные ключи, и всё это ловилось по одному за
 * перезапуск. Проверяем весь список сразу и до старта Nest.
 */
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
