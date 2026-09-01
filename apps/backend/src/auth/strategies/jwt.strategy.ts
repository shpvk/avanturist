import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    public constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
    }

    /**
     * Access-токен самодостаточен: в базу не ходим, иначе теряется весь смысл
     * короткого срока жизни. Свежие данные пользователь получает при ротации.
     */
    public validate(payload: JwtPayload): AuthenticatedUser {
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
