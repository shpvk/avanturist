import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'argon2';
import { AuthService } from '../auth.service';
import { TokenType } from '../../generated/prisma/enums';

const meta = {};

function createService(overrides: {
    user?: unknown;
    consumed?: unknown;
} = {}) {
    const userService = {
        findByEmail: jest.fn().mockResolvedValue(overrides.user ?? null),
        findById: jest.fn(),
        findByIdOrNull: jest.fn(),
        create: jest.fn(),
        markVerified: jest.fn().mockImplementation(async () => ({
            ...(overrides.user as object),
            isVerified: true,
        })),
        updatePassword: jest.fn(),
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

    const mailService = {
        sendVerification: jest.fn(),
        sendPasswordReset: jest.fn(),
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

    it('не пускает по паролю аккаунт, заведённый через Google', async () => {
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
});
