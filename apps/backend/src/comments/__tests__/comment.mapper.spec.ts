import {
    CommentRow,
    toPublicComment,
} from '../comment.mapper';

const now = new Date('2026-09-02T12:00:00.000Z');

function row(overrides: Partial<CommentRow> = {}): CommentRow {
    return {
        id: 'comment-1',
        buildId: 'build-1',
        text: 'Каю на антимаге не воспринимал всерьёз',
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
        deletedAt: null,
        author: {
            id: 'user-1',
            displayName: 'SilentStep',
            picture: null,
            mutedAt: null,
            mutedUntil: null,
        },
        ...overrides,
    };
}

describe('toPublicComment', () => {
    it('не показывает читателю ни скрытие, ни мут автора', () => {
        const comment = toPublicComment(
            row({
                deletedAt: new Date('2026-09-02T11:00:00.000Z'),
                author: {
                    id: 'user-1',
                    displayName: 'SilentStep',
                    picture: null,
                    mutedAt: now,
                    mutedUntil: null,
                },
            }),
            { moderator: false },
        );

        expect(comment).toEqual({
            id: 'comment-1',
            buildId: 'build-1',
            author: 'SilentStep',
            authorId: 'user-1',
            authorPicture: null,
            text: 'Каю на антимаге не воспринимал всерьёз',
            createdAt: '2026-09-01T10:00:00.000Z',
        });
    });

    it('администратору отдаёт пометку скрытия', () => {
        const comment = toPublicComment(
            row({ deletedAt: new Date('2026-09-02T11:00:00.000Z') }),
            { moderator: true, now },
        );

        expect(comment.isDeleted).toBe(true);
        expect(comment.deletedAt).toBe('2026-09-02T11:00:00.000Z');
    });

    it('бессрочный мут отличается от срочного пустым сроком, а не датой', () => {
        const comment = toPublicComment(
            row({
                author: {
                    id: 'user-1',
                    displayName: 'SilentStep',
                    picture: null,
                    mutedAt: new Date('2026-09-01T10:00:00.000Z'),
                    mutedUntil: null,
                },
            }),
            { moderator: true, now },
        );

        expect(comment.authorMuted).toBe(true);
        expect(comment.authorMutedUntil).toBeNull();
    });

    it('истёкший мут в ветке уже не отображается', () => {
        const comment = toPublicComment(
            row({
                author: {
                    id: 'user-1',
                    displayName: 'SilentStep',
                    picture: null,
                    mutedAt: new Date('2026-09-01T10:00:00.000Z'),
                    mutedUntil: new Date('2026-09-02T11:00:00.000Z'),
                },
            }),
            { moderator: true, now },
        );

        expect(comment.authorMuted).toBe(false);
        expect(comment.authorMutedUntil).toBeNull();
    });

    it('действующий мут приходит со сроком', () => {
        const comment = toPublicComment(
            row({
                author: {
                    id: 'user-1',
                    displayName: 'SilentStep',
                    picture: null,
                    mutedAt: new Date('2026-09-02T11:00:00.000Z'),
                    mutedUntil: new Date('2026-09-03T11:00:00.000Z'),
                },
            }),
            { moderator: true, now },
        );

        expect(comment.authorMuted).toBe(true);
        expect(comment.authorMutedUntil).toBe('2026-09-03T11:00:00.000Z');
    });
});
