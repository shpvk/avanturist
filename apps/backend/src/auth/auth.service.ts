import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { verify } from 'argon2';
import { UserService } from '../user/user.service';
import { AuthMethod } from '../generated/prisma/enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** The account as the front end is allowed to see it: no password hash, no linked accounts. */
export type PublicUser = {
    id: string;
    email: string;
    displayName: string;
    picture: string | null;
    role: string;
    createdAt: Date;
};

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    public async register(request: Request, dto: RegisterDto): Promise<PublicUser> {
        const existing = await this.userService.findByEmailOrNull(dto.email);

        if (existing) {
            throw new ConflictException('Пользователь с такой почтой уже зарегистрирован');
        }

        const user = await this.userService.create(
            dto.email,
            dto.password,
            dto.name,
            '',
            AuthMethod.CREDENTIALS,
            false,
        );

        return this.saveSession(request, user);
    }

    public async login(request: Request, dto: LoginDto): Promise<PublicUser> {
        const user = await this.userService.findByEmailOrNull(dto.email);

        // The same answer for an unknown email and a wrong password: which of the two it
        // was is not something a caller should be able to probe for.
        if (!user || !user.password) {
            throw new UnauthorizedException('Неверная почта или пароль');
        }

        // argon2 throws on an empty or malformed stored hash, and that has to
        // fail the login instead of blowing up the request.
        const isPasswordValid = await verify(user.password, dto.password).catch(() => false);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Неверная почта или пароль');
        }

        return this.saveSession(request, user);
    }

    /** The signed-in account for this session; 401 when there is none. */
    public async me(request: Request): Promise<PublicUser> {
        const userId = request.session.userId;

        if (!userId) {
            throw new UnauthorizedException('Вы не авторизованы');
        }

        try {
            return toPublicUser(await this.userService.findById(userId));
        } catch (error) {
            // The account is gone but its session outlived it — end the session too.
            if (error instanceof NotFoundException) {
                await this.logout(request);
                throw new UnauthorizedException('Вы не авторизованы');
            }

            throw error;
        }
    }

    public async logout(request: Request): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            request.session.destroy((error) => {
                if (error) {
                    reject(new InternalServerErrorException('Не удалось завершить сессию'));
                    return;
                }

                resolve();
            });
        });
    }

    /** Session writes are explicit: the response must not be sent before the store has it. */
    private async saveSession(request: Request, user: { id: string } & Record<string, unknown>): Promise<PublicUser> {
        request.session.userId = user.id;

        await new Promise<void>((resolve, reject) => {
            request.session.save((error) => {
                if (error) {
                    reject(new InternalServerErrorException('Не удалось сохранить сессию'));
                    return;
                }

                resolve();
            });
        });

        return toPublicUser(user);
    }
}

function toPublicUser(user: Record<string, any>): PublicUser {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        picture: user.picture ?? null,
        role: user.role,
        createdAt: user.createdAt,
    };
}
