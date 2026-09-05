import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

/** Профиль Google в том виде, в котором его дальше обрабатывает AuthService. */
export interface GoogleProfile {
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
    displayName: string;
    picture: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    public constructor(configService: ConfigService) {
        super({
            clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    /**
     * Токены Google дальше не передаём: приложению они не нужны, а лишняя
     * копия чужого доступа — только риск утечки.
     */
    public validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): void {
        const email = profile.emails?.[0];

        if (!email?.value) {
            done(new Error('Google account has no email.'), undefined);

            return;
        }

        const user: GoogleProfile = {
            providerAccountId: profile.id,
            email: email.value,
            // Google отдаёт verified как boolean или строку в зависимости от версии профиля.
            emailVerified: String((email as { verified?: unknown }).verified) === 'true',
            displayName: profile.displayName || email.value.split('@')[0],
            picture: profile.photos?.[0]?.value ?? null,
        };

        done(null, user);
    }
}
