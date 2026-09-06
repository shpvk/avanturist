import { UserRole } from '../../generated/prisma/enums';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    jti: string;
    familyId: string;
    iat?: number;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    jti: string;
    familyId: string;
}

export interface SessionMeta {
    userAgent?: string;
    ip?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
