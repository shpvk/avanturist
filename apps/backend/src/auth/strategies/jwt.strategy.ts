import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenService } from '../token.service';
import { AuthenticatedUser, JwtPayload } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    public constructor(
        configService: ConfigService,
        private readonly tokenService: TokenService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            // Алгоритм закрепляем явно: иначе проверка приняла бы любой из
            // подходящих к симметричному ключу.
            algorithms: ['HS256'],
        });
    }

    /**
     * В базу за пользователем не ходим: иначе теряется весь смысл короткого
     * срока жизни. Свежие данные приходят при ротации. Единственная внешняя
     * проверка — метка «все прежние токены отозваны», иначе выход со всех
     * устройств и смена пароля не действовали бы до конца TTL access-токена.
     */
    public async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
        const revoked = await this.tokenService.isAccessRevoked(
            payload.sub,
            payload.iat,
        );

        if (revoked) {
            throw new UnauthorizedException('Session is no longer valid.');
        }

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            isVerified: payload.isVerified,
            jti: payload.jti,
            familyId: payload.familyId,
        };
    }
}
