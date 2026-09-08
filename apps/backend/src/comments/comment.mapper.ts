import { isMuted } from '../user/mute.util';

export interface PublicComment {
    id: string;
    buildId: string;
    author: string;
    authorId: string;
    authorPicture: string | null;
    text: string;
    createdAt: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    authorMuted?: boolean;
    authorMutedUntil?: string | null;
}

export interface CommentRow {
    id: string;
    buildId: string;
    text: string;
    createdAt: Date;
    deletedAt: Date | null;
    author: {
        id: string;
        displayName: string;
        picture: string | null;
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
            picture: true,
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
        authorPicture: comment.author.picture,
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
