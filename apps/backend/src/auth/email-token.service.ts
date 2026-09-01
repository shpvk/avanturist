import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TokenType } from '../generated/prisma/enums';
import { Token } from '../generated/prisma/client';

const TTL_BY_TYPE: Record<TokenType, number> = {
    VERIFICATION: 24 * 60 * 60 * 1000,
    PASSWORD_RESET: 60 * 60 * 1000,
};

/** Одноразовые токены из писем: подтверждение почты и сброс пароля. */
@Injectable()
export class EmailTokenService {
    public constructor(private readonly prismaService: PrismaService) {}

    /** Выдаёт новый токен, гася все прежние того же типа для этого адреса. */
    public async issue(email: string, type: TokenType): Promise<string> {
        const token = randomBytes(32).toString('base64url');

        await this.prismaService.$transaction([
            this.prismaService.token.deleteMany({ where: { email, type } }),
            this.prismaService.token.create({
                data: {
                    email,
                    token,
                    type,
                    expiresIn: new Date(Date.now() + TTL_BY_TYPE[type]),
                },
            }),
        ]);

        return token;
    }

    /** Возвращает токен и сразу удаляет его: повторно им воспользоваться нельзя. */
    public async consume(token: string, type: TokenType): Promise<Token | null> {
        const stored = await this.prismaService.token.findUnique({
            where: { token },
        });

        if (!stored || stored.type !== type) {
            return null;
        }

        await this.prismaService.token.delete({ where: { id: stored.id } });

        if (stored.expiresIn.getTime() < Date.now()) {
            return null;
        }

        return stored;
    }
}
