#!/usr/bin/env tsx
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import {
    buildMailTransport,
    describeMailTransport,
} from '../apps/backend/src/mail/mail-transport.config';
import { VerificationEmail } from '../apps/backend/src/mail/templates/verification.template';

const repositoryRoot = path.resolve(__dirname, '..');

function loadEnv(): void {
    const envPath = path.join(repositoryRoot, '.env');
    if (existsSync(envPath)) process.loadEnvFile(envPath);
}

async function main(): Promise<void> {
    loadEnv();

    const recipient = process.argv[2];

    if (!recipient) {
        console.error('Укажите адрес получателя: npm run mail:test -- you@example.com');
        process.exitCode = 1;
        return;
    }

    const configService = new ConfigService();
    const options = buildMailTransport(configService);
    const from = configService.getOrThrow<string>('MAIL_FROM');
    const origin = configService.getOrThrow<string>('ALLOWED_ORIGIN');

    console.log(`Транспорт: ${describeMailTransport(options)}`);
    console.log(`From: ${from}`);

    const transporter = createTransport(options, { from });

    await transporter.verify();
    console.log('Соединение и авторизация в порядке.');

    const link = `${origin}/auth/verify?token=test-token`;
    const template = VerificationEmail({ link });
    const [html, text] = await Promise.all([
        render(template),
        render(template, { plainText: true }),
    ]);

    const info = await transporter.sendMail({
        to: recipient,
        subject: 'Проверка отправки BuildVerdict',
        html,
        text,
    });

    console.log(`Принято сервером: ${info.accepted.join(', ') || 'ничего'}`);
    if (info.rejected.length) console.log(`Отклонено: ${info.rejected.join(', ')}`);
    console.log(`messageId: ${info.messageId}`);
    console.log(`Ответ SMTP: ${info.response}`);

    transporter.close();
}

main().catch((error: unknown) => {
    console.error('Отправка не удалась:', error);
    process.exitCode = 1;
});
