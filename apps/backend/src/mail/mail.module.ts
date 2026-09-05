import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.getOrThrow<string>('MAIL_HOST'),
                    port: configService.getOrThrow<number>('MAIL_PORT'),
                    secure: false,
                    auth: configService.get<string>('MAIL_USER')
                        ? {
                              user: configService.getOrThrow<string>('MAIL_USER'),
                              pass: configService.getOrThrow<string>('MAIL_PASSWORD'),
                          }
                        : undefined,
                },
                defaults: {
                    from: configService.getOrThrow<string>('MAIL_FROM'),
                },
            }),
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
