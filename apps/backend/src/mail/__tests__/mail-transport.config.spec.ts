import { ConfigService } from '@nestjs/config';
import { buildMailTransport, describeMailTransport } from '../mail-transport.config';

function config(values: Record<string, string>): ConfigService {
    return {
        get: (key: string) => values[key],
        getOrThrow: (key: string) => {
            if (values[key] === undefined) {
                throw new Error(`${key} is not set`);
            }

            return values[key];
        },
    } as unknown as ConfigService;
}

const localMailpit = {
    MAIL_HOST: 'localhost',
    MAIL_PORT: '1025',
    MAIL_FROM: 'BuildVerdict <no-reply@buildverdict.local>',
};

const provider = {
    MAIL_HOST: 'smtp.provider.test',
    MAIL_PORT: '587',
    MAIL_USER: 'apikey',
    MAIL_PASSWORD: 'secret',
    MAIL_FROM: 'BuildVerdict <no-reply@buildverdict.ru>',
};

describe('buildMailTransport', () => {
    it('локальный перехватчик писем работает без шифрования и логина', () => {
        const options = buildMailTransport(config(localMailpit));

        expect(options).toMatchObject({
            host: 'localhost',
            port: 1025,
            secure: false,
            requireTLS: false,
            auth: undefined,
        });
    });

    it('на порту 587 с логином требует STARTTLS', () => {
        const options = buildMailTransport(config(provider));

        expect(options).toMatchObject({
            secure: false,
            requireTLS: true,
            auth: { user: 'apikey', pass: 'secret' },
        });
        expect(options.tls.rejectUnauthorized).toBe(true);
    });

    it('на порту 465 включает TLS сразу', () => {
        const options = buildMailTransport(
            config({ ...provider, MAIL_PORT: '465' }),
        );

        expect(options.secure).toBe(true);
        expect(options.requireTLS).toBe(false);
    });

    it('явные переключатели важнее вывода по порту', () => {
        const options = buildMailTransport(
            config({
                ...provider,
                MAIL_SECURE: 'true',
                MAIL_TLS_REJECT_UNAUTHORIZED: 'false',
            }),
        );

        expect(options.secure).toBe(true);
        expect(options.tls.rejectUnauthorized).toBe(false);
    });

    it('отвергает нечисловой порт и мусор в переключателях', () => {
        expect(() =>
            buildMailTransport(config({ ...provider, MAIL_PORT: 'smtp' })),
        ).toThrow(/MAIL_PORT/);

        expect(() =>
            buildMailTransport(config({ ...provider, MAIL_SECURE: 'yes' })),
        ).toThrow(/MAIL_SECURE/);
    });

    it('описывает транспорт для логов без пароля', () => {
        const description = describeMailTransport(buildMailTransport(config(provider)));

        expect(description).toBe('smtp.provider.test:587 (STARTTLS, as apikey)');
        expect(description).not.toContain('secret');
    });
});
