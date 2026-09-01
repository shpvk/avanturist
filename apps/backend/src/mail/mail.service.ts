import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { VerificationEmail } from './templates/verification.template';
import { PasswordResetEmail } from './templates/password-reset.template';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    public constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    public async sendVerification(email: string, token: string): Promise<void> {
        const link = this.frontendLink('/auth/verify', token);
        const html = await render(VerificationEmail({ link }));

        await this.send(email, 'Подтвердите почту в BuildVerdict', html);
    }

    public async sendPasswordReset(email: string, token: string): Promise<void> {
        const link = this.frontendLink('/auth/password-reset', token);
        const html = await render(PasswordResetEmail({ link }));

        await this.send(email, 'Сброс пароля в BuildVerdict', html);
    }

    /**
     * Ошибка отправки не должна ронять регистрацию: письмо всегда можно запросить
     * повторно, а пользователь уже создан.
     */
    private async send(to: string, subject: string, html: string): Promise<void> {
        try {
            await this.mailerService.sendMail({ to, subject, html });
        } catch (error) {
            this.logger.error(`Failed to send "${subject}" to ${to}.`, error);
        }
    }

    private frontendLink(path: string, token: string): string {
        const origin = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');

        return `${origin}${path}?token=${encodeURIComponent(token)}`;
    }
}
