import { ConfigService } from '@nestjs/config';
import { parseBoolean } from '../libs/common/utils/parse-boolean.utils';

const IMPLICIT_TLS_PORT = 465;

export interface MailTransportOptions {
    host: string;
    port: number;
    secure: boolean;
    requireTLS: boolean;
    auth?: { user: string; pass: string };
    pool: true;
    maxConnections: number;
    maxMessages: number;
    rateDelta: number;
    rateLimit: number;
    connectionTimeout: number;
    greetingTimeout: number;
    socketTimeout: number;
    tls: { minVersion: 'TLSv1.2'; rejectUnauthorized: boolean };
}

export function readMailBoolean(
    configService: ConfigService,
    key: string,
): boolean | undefined {
    const raw = configService.get<string>(key)?.trim();

    if (!raw) {
        return undefined;
    }

    try {
        return parseBoolean(raw);
    } catch {
        throw new Error(`${key} must be 'true' or 'false', got "${raw}".`);
    }
}

export function buildMailTransport(
    configService: ConfigService,
): MailTransportOptions {
    const host = configService.getOrThrow<string>('MAIL_HOST').trim();
    const rawPort = String(configService.getOrThrow<string | number>('MAIL_PORT'));
    const port = Number(rawPort);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`MAIL_PORT must be a port number, got "${rawPort}".`);
    }

    const user = configService.get<string>('MAIL_USER')?.trim();
    const secure = readMailBoolean(configService, 'MAIL_SECURE') ?? port === IMPLICIT_TLS_PORT;

    return {
        host,
        port,
        secure,
        requireTLS:
            readMailBoolean(configService, 'MAIL_REQUIRE_TLS') ??
            (!secure && Boolean(user)),
        auth: user
            ? {
                  user,
                  pass: configService.getOrThrow<string>('MAIL_PASSWORD'),
              }
            : undefined,
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        rateDelta: 1_000,
        rateLimit: 5,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 30_000,
        tls: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized:
                readMailBoolean(configService, 'MAIL_TLS_REJECT_UNAUTHORIZED') ?? true,
        },
    };
}

export function describeMailTransport(options: MailTransportOptions): string {
    const encryption = options.secure
        ? 'TLS'
        : options.requireTLS
          ? 'STARTTLS'
          : 'no encryption';
    const credentials = options.auth ? `as ${options.auth.user}` : 'without credentials';

    return `${options.host}:${options.port} (${encryption}, ${credentials})`;
}
