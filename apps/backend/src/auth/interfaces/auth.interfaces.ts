import { UserRole } from '../../generated/prisma/enums';

/** Полезная нагрузка access-токена. */
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    jti: string;
    familyId: string;
}

/** Пользователь, положенный в запрос после проверки access-токена. */
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    jti: string;
    familyId: string;
}

/** Контекст запроса, который сохраняется вместе с refresh-сессией. */
export interface SessionMeta {
    userAgent?: string;
    ip?: string;
}

/** Пара токенов, отдаваемая клиенту. */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
