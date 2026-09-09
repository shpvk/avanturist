import {
    BadRequestException,
    ConflictException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { hash } from 'argon2';
import { AuthService } from '../auth.service';
import { TokenType } from '../../generated/prisma/enums';
import { MailDeliveryError } from '../../mail/mail-delivery.error';

const meta = {};

function createService(overrides: {
    user?: unknown;
    consumed?: unknown;
    undeliverable?: boolean;
} = {}) {
    const user = overrides.user
        ? { createdAt: new Date('2026-01-01T00:00:00.000Z'), ...(overrides.user as object) }
        : null;

    const userService = {
        findByEmail: jest.fn().mockResolvedValue(user),
        findById: jest.fn().mockResolvedValue(user),
        findByIdOrNull: jest.fn(),
        create: jest.fn(),
        markVerified: jest.fn().mockImplementation(async () => ({
            ...(user as object),
            isVerified: true,
        })),
        updatePassword: jest.fn().mockImplementation(async () => user),
        updateDisplayName: jest.fn().mockImplementation(
            async (_id: string, displayName: string) => ({
                ...(user as object),
                displayName,
            }),
        ),
        updateEmail: jest.fn().mockImplementation(
            async (_id: string, email: string) => ({
                ...(user as object),
                email,
                isVerified: false,
            }),
        ),
    };

    const tokenService = {
        issuePair: jest.fn().mockResolvedValue({
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresIn: 900,
        }),
        revokeAllForUser: jest.fn(),
    };

    const emailTokenService = {
        issue: jest.fn().mockResolvedValue('email-token'),
        consume: jest.fn().mockResolvedValue(overrides.consumed ?? null),
    };

    const undeliverable = () =>
        Promise.reject(new MailDeliveryError('tester@example.com', 'subject'));

    const mailService = {
        sendVerification: overrides.undeliverable
            ? jest.fn().mockImplementation(undeliverable)
            : jest.fn(),
        sendPasswordReset: overrides.undeliverable
            ? jest.fn().mockImplementation(undeliverable)
            : jest.fn(),
    };

    const service = new AuthService(
        userService as never,
        tokenService as never,
        emailTokenService as never,
        mailService as never,
    );

    return { service, userService, tokenService, emailTokenService, mailService };
}

describe('AuthService', () => {
    it('на неизвестный адрес и на неверный пароль отвечает одинаково', async () => {
        const unknown = createService();

        const withUser = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                password: await hash('correct-password'),
                isVerified: true,
            },
        });

        const captureError = async (promise: Promise<unknown>): Promise<Error> => {
            try {
                await promise;
            } catch (error) {
                return error as Error;
            }

            throw new Error('Login unexpectedly succeeded.');
        };

        const unknownError = await captureError(
            unknown.service.login(
                { email: 'nobody@example.com', password: 'whatever12' },
                meta,
            ),
        );

        const wrongPasswordError = await captureError(
            withUser.service.login(
                { email: 'tester@example.com', password: 'wrong-password' },
                meta,
            ),
        );

        expect(unknownError).toBeInstanceOf(UnauthorizedException);
        expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
        expect(unknownError.message).toBe(wrongPasswordError.message);
    });

    it('пускает по верному паролю', async () => {
        const { service } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                password: await hash('correct-password'),
                displayName: 'Tester',
                picture: null,
                role: 'REGULAR',
                isVerified: true,
            },
        });

        const response = await service.login(
            { email: 'tester@example.com', password: 'correct-password' },
            meta,
        );

        expect(response.accessToken).toBe('access');
        expect(response.user.email).toBe('tester@example.com');
    });

    it('не пускает по паролю аккаунт без пароля', async () => {
        const { service } = createService({
            user: { id: 'user-1', email: 'g@example.com', password: null },
        });

        await expect(
            service.login({ email: 'g@example.com', password: 'anything12' }, meta),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('подтверждает почту по токену из письма', async () => {
        const { service, userService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                displayName: 'Tester',
                picture: null,
                role: 'REGULAR',
                isVerified: false,
            },
            consumed: { email: 'tester@example.com', type: TokenType.VERIFICATION },
        });

        const user = await service.verifyEmail('email-token');

        expect(userService.markVerified).toHaveBeenCalledWith('user-1');
        expect(user.isVerified).toBe(true);
    });

    it('отклоняет просроченный или уже использованный токен верификации', async () => {
        const { service } = createService();

        await expect(service.verifyEmail('stale')).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('запрос сброса молчит про несуществующий адрес', async () => {
        const { service, mailService } = createService();

        await expect(
            service.requestPasswordReset('nobody@example.com'),
        ).resolves.toBeUndefined();
        expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('смена пароля разлогинивает все устройства', async () => {
        const { service, userService, tokenService } = createService({
            user: { id: 'user-1', email: 'tester@example.com', password: 'hash' },
            consumed: { email: 'tester@example.com', type: TokenType.PASSWORD_RESET },
        });

        await service.resetPassword('reset-token', 'new-password1');

        expect(userService.updatePassword).toHaveBeenCalledWith(
            'user-1',
            'new-password1',
        );
        expect(tokenService.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });

    it('смена ника обрезает пробелы и возвращает обновлённый профиль', async () => {
        const { service, userService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                displayName: 'Tester',
                picture: null,
                role: 'REGULAR',
                isVerified: true,
            },
        });

        const profile = await service.updateProfile('user-1', {
            displayName: '  Новый Ник  ',
        });

        expect(userService.updateDisplayName).toHaveBeenCalledWith(
            'user-1',
            'Новый Ник',
        );
        expect(profile.displayName).toBe('Новый Ник');
    });

    it('смена ника отклоняет строку из одних пробелов', async () => {
        const { service, userService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                displayName: 'Tester',
                isVerified: true,
            },
        });

        await expect(
            service.updateProfile('user-1', { displayName: '   ' }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(userService.updateDisplayName).not.toHaveBeenCalled();
    });

    it('смена пароля из настроек разлогинивает остальные устройства', async () => {
        const { service, userService, tokenService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                password: await hash('correct-password'),
                displayName: 'Tester',
                picture: null,
                role: 'REGULAR',
                isVerified: true,
            },
        });

        const response = await service.changePassword(
            'user-1',
            {
                currentPassword: 'correct-password',
                password: 'brand-new-password',
                passwordRepeat: 'brand-new-password',
            },
            meta,
        );

        expect(userService.updatePassword).toHaveBeenCalledWith(
            'user-1',
            'brand-new-password',
        );
        expect(tokenService.revokeAllForUser).toHaveBeenCalledWith('user-1');
        expect(response.accessToken).toBe('access');
    });

    it('смена пароля отклоняет неверный текущий пароль', async () => {
        const { service, userService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                password: await hash('correct-password'),
                isVerified: true,
            },
        });

        await expect(
            service.changePassword(
                'user-1',
                {
                    currentPassword: 'wrong-password',
                    password: 'brand-new-password',
                    passwordRepeat: 'brand-new-password',
                },
                meta,
            ),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(userService.updatePassword).not.toHaveBeenCalled();
    });

    it('смена почты снимает подтверждение и отправляет письмо на новый адрес', async () => {
        const { service, userService, mailService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                password: await hash('correct-password'),
                displayName: 'Tester',
                picture: null,
                role: 'REGULAR',
                isVerified: true,
            },
        });

        userService.findByEmail.mockResolvedValue(null);

        const response = await service.changeEmail(
            'user-1',
            { email: 'Fresh@Example.com', currentPassword: 'correct-password' },
            meta,
        );

        expect(userService.updateEmail).toHaveBeenCalledWith(
            'user-1',
            'fresh@example.com',
        );
        expect(mailService.sendVerification).toHaveBeenCalled();
        expect(response.user.isVerified).toBe(false);
        expect(response.verificationEmailSent).toBe(true);
    });

    it('смена почты отклоняет занятый адрес', async () => {
        const { service, userService } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                password: await hash('correct-password'),
                isVerified: true,
            },
        });

        await expect(
            service.changeEmail(
                'user-1',
                { email: 'taken@example.com', currentPassword: 'correct-password' },
                meta,
            ),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(userService.updateEmail).not.toHaveBeenCalled();
    });

    it('регистрация проходит, но помечает неотправленное письмо', async () => {
        const { service, userService, mailService } = createService({
            undeliverable: true,
        });

        userService.create.mockResolvedValue({
            id: 'user-1',
            email: 'tester@example.com',
            displayName: 'Tester',
            picture: null,
            role: 'REGULAR',
            isVerified: false,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
        });

        const response = await service.register(
            {
                name: 'Tester',
                email: 'tester@example.com',
                password: 'password12',
                passwordRepeat: 'password12',
            },
            meta,
        );

        expect(mailService.sendVerification).toHaveBeenCalled();
        expect(response.accessToken).toBe('access');
        expect(response.verificationEmailSent).toBe(false);
    });

    it('повторная отправка письма сообщает о недоступности почты', async () => {
        const { service } = createService({
            user: {
                id: 'user-1',
                email: 'tester@example.com',
                isVerified: false,
            },
            undeliverable: true,
        });

        await expect(
            service.resendVerification('tester@example.com'),
        ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('повторная отправка молчит про подтверждённый и неизвестный адрес', async () => {
        const verified = createService({
            user: { id: 'user-1', email: 'tester@example.com', isVerified: true },
        });
        const unknown = createService();

        await expect(
            verified.service.resendVerification('tester@example.com'),
        ).resolves.toBeUndefined();
        await expect(
            unknown.service.resendVerification('nobody@example.com'),
        ).resolves.toBeUndefined();

        expect(verified.mailService.sendVerification).not.toHaveBeenCalled();
        expect(unknown.mailService.sendVerification).not.toHaveBeenCalled();
    });

    it('сброс пароля сообщает о недоступности почты', async () => {
        const { service } = createService({
            user: { id: 'user-1', email: 'tester@example.com', password: 'hash' },
            undeliverable: true,
        });

        await expect(
            service.requestPasswordReset('tester@example.com'),
        ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
});
