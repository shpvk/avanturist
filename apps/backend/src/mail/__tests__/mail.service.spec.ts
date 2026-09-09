import { Logger } from '@nestjs/common';
import type { ReactElement } from 'react';
import { MailService } from '../mail.service';
import { MailDeliveryError } from '../mail-delivery.error';

jest.mock('@react-email/render', () => ({
    render: jest.fn(
        async (node: ReactElement<{ link: string }>, options?: { plainText?: boolean }) =>
            options?.plainText
                ? `Ссылка: ${node.props.link}`
                : `<html><a href="${node.props.link}">Ссылка</a></html>`,
    ),
}));

function smtpError(overrides: { code?: string; responseCode?: number }): Error {
    return Object.assign(new Error('SMTP said no'), overrides);
}

function createService(sendMail: jest.Mock) {
    const mailerService = { sendMail, verifyAllTransporters: jest.fn() };
    const configService = {
        get: jest.fn(),
        getOrThrow: jest.fn().mockReturnValue('https://buildverdict.test'),
    };

    return new MailService(mailerService as never, configService as never);
}

describe('MailService', () => {
    beforeAll(() => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
        jest.spyOn(Logger.prototype, 'warn').mockImplementation();
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    it('кладёт в письмо ссылку на фронтенд и текстовую версию', async () => {
        const sendMail = jest.fn().mockResolvedValue(undefined);

        await createService(sendMail).sendVerification('tester@example.com', 'tok en');

        const message = sendMail.mock.calls[0][0];

        expect(message.to).toBe('tester@example.com');
        expect(message.html).toContain(
            'https://buildverdict.test/auth/verify?token=tok%20en',
        );
        expect(message.text).toBe(
            'Ссылка: https://buildverdict.test/auth/verify?token=tok%20en',
        );
    });

    it('повторяет отправку после временной ошибки', async () => {
        const sendMail = jest
            .fn()
            .mockRejectedValueOnce(smtpError({ responseCode: 451 }))
            .mockResolvedValueOnce(undefined);

        await expect(
            createService(sendMail).sendPasswordReset('tester@example.com', 'token'),
        ).resolves.toBeUndefined();

        expect(sendMail).toHaveBeenCalledTimes(2);
    });

    it('не повторяет отправку после постоянного отказа сервера', async () => {
        const sendMail = jest.fn().mockRejectedValue(smtpError({ responseCode: 550 }));

        await expect(
            createService(sendMail).sendVerification('tester@example.com', 'token'),
        ).rejects.toBeInstanceOf(MailDeliveryError);

        expect(sendMail).toHaveBeenCalledTimes(1);
    });

    it('не повторяет отправку после отказа в авторизации', async () => {
        const sendMail = jest.fn().mockRejectedValue(smtpError({ code: 'EAUTH' }));

        await expect(
            createService(sendMail).sendVerification('tester@example.com', 'token'),
        ).rejects.toBeInstanceOf(MailDeliveryError);

        expect(sendMail).toHaveBeenCalledTimes(1);
    });

    it('сдаётся после трёх попыток при недоступном сервере', async () => {
        const sendMail = jest.fn().mockRejectedValue(smtpError({ code: 'ECONNECTION' }));

        await expect(
            createService(sendMail).sendVerification('tester@example.com', 'token'),
        ).rejects.toBeInstanceOf(MailDeliveryError);

        expect(sendMail).toHaveBeenCalledTimes(3);
    });
});
