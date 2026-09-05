import { isMuted } from '../user/mute.util';

/**
 * Комментарий в том виде, в каком его отдаёт API. Поля модерации приходят
 * только администратору: срок мута и факт скрытия — служебная информация,
 * читателям ветки её знать незачем.
 */
export interface PublicComment {
    id: string;
    buildId: string;
    author: string;
    authorId: string;
    text: string;
    createdAt: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    authorMuted?: boolean;
    /** `null` при бессрочном муте — вместе с `authorMuted: true`. */
    authorMutedUntil?: string | null;
}

/** Строка комментария с автором: ровно то, что выбирает `commentSelect`. */
export interface CommentRow {
    id: string;
    buildId: string;
    text: string;
    createdAt: Date;
    deletedAt: Date | null;
    author: {
        id: string;
        displayName: string;
        mutedAt: Date | null;
        mutedUntil: Date | null;
    };
}

export const commentSelect = {
    id: true,
    buildId: true,
    text: true,
    createdAt: true,
    deletedAt: true,
    author: {
        select: {
            id: true,
            displayName: true,
            mutedAt: true,
            mutedUntil: true,
        },
    },
} as const;

export function toPublicComment(
    comment: CommentRow,
    options: { moderator: boolean; now?: Date } = { moderator: false },
): PublicComment {
    const base: PublicComment = {
        id: comment.id,
        buildId: comment.buildId,
        author: comment.author.displayName,
        authorId: comment.author.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
    };

    if (!options.moderator) {
        return base;
    }

    const muted = isMuted(comment.author, options.now);

    return {
        ...base,
        isDeleted: comment.deletedAt !== null,
        deletedAt: comment.deletedAt?.toISOString() ?? null,
        authorMuted: muted,
        authorMutedUntil: muted
            ? (comment.author.mutedUntil?.toISOString() ?? null)
            : null,
    };
}
