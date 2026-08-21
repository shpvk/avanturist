import { resolve } from 'node:path';

/** Читает корневой .env: файл лежит на три уровня выше src/ и dist/. */
export function loadRootEnv(): void {
    try {
        process.loadEnvFile(resolve(__dirname, '../../../.env'));
    } catch {
        // .env необязателен: значения по умолчанию оставляют приложение рабочим.
    }
}
