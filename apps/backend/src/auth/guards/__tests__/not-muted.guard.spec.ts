import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { NotMutedGuard } from '../not-muted.guard';
import { ActiveMute, UserService } from '../../../user/user.service';
import { AuthenticatedUser } from '../../interfaces/auth.interfaces';
import { UserRole } from '../../../generated/prisma/enums';

const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'silent@example.com',
    role: UserRole.REGULAR,
    isVerified: true,
    jti: 'jti-1',
    familyId: 'family-1',
};

function contextFor(request: { user?: AuthenticatedUser }): ExecutionContext {
    return {
        switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
}

function guardWith(mute: ActiveMute | null): NotMutedGuard {
    const userService = {
        activeMute: jest.fn().mockResolvedValue(mute),
    } as unknown as UserService;

    return new NotMutedGuard(userService);
}

describe('NotMutedGuard', () => {
    it('пропускает пользователя без мута', async () => {
        await expect(guardWith(null).canActivate(contextFor({ user }))).resolves.toBe(true);
    });

    it('не пропускает запрос без пользователя', async () => {
        await expect(guardWith(null).canActivate(contextFor({}))).resolves.toBe(false);
    });

    it('в отказе отдаёт срок и причину, а не голое «нельзя»', async () => {
        const until = new Date('2026-09-03T11:00:00.000Z');
        const guard = guardWith({ until, reason: 'оскорбления в ветке' });

        await expect(guard.canActivate(contextFor({ user }))).rejects.toMatchObject({
            response: {
                mutedUntil: until.toISOString(),
                muteReason: 'оскорбления в ветке',
            },
        });
    });

    it('бессрочный мут отдаёт пустой срок, а не выдуманную дату', async () => {
        const guard = guardWith({ until: null, reason: null });

        try {
            await guard.canActivate(contextFor({ user }));
            fail('мут должен закрывать комментарии');
        } catch (error) {
            expect(error).toBeInstanceOf(ForbiddenException);
            expect((error as ForbiddenException).getResponse()).toMatchObject({
                mutedUntil: null,
                muteReason: null,
            });
        }
    });
});
