import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { setTimeout as delay } from 'node:timers/promises';
import { createElement, type ReactElement } from 'react';
import { VerificationEmail } from './templates/verification.template';
import { PasswordResetEmail } from './templates/password-reset.template';
import { MailDeliveryError } from './mail-delivery.error';
import { buildMailTransport, describeMailTransport } from './mail-transport.config';
import { parseAllowedOrigins } from '../libs/common/utils/allowed-origins.utils';

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const FIRST_PERMANENT_SMTP_CODE = 500;
const PERMANENT_ERROR_CODES = new Set(['EAUTH', 'EENVELOPE', 'EMESSAGE']);

export function isRetryableDeliveryError(error: unknown): boolean {
    const { code, responseCode } = (error ?? {}) as {
        code?: string;
        responseCode?: number;
    };

    if (typeof responseCode === 'number') {
        return responseCode < FIRST_PERMANENT_SMTP_CODE;
    }

    return !code || !PERMANENT_ERROR_CODES.has(code);
}

@Injectable()
export class MailService implements OnApplicationBootstrap {
    private readonly logger = new Logger(MailService.name);

    public constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {}

    public async onApplicationBootstrap(): Promise<void> {
        const target = describeMailTransport(buildMailTransport(this.configService));

        try {
            const reachable = await this.mailerService.verifyAllTransporters();

            if (reachable) {
                this.logger.log(`SMTP transport ready: ${target}.`);

                return;
            }

            this.logger.error(`SMTP transport rejected the handshake: ${target}.`);
        } catch (error) {
            this.logger.error(`SMTP transport is unreachable: ${target}.`, error);
        }

        this.logger.error(
            'Verification and password reset emails will fail until SMTP works.',
        );
    }

    public async sendVerification(email: string, token: string): Promise<void> {
        const link = this.frontendLink('/auth/verify', token);

        await this.send(
            email,
            'Confirm your email for BuildVerdict',
            createElement(VerificationEmail, { link }),
        );
    }

    public async sendPasswordReset(email: string, token: string): Promise<void> {
        const link = this.frontendLink('/auth/password-reset', token);

        await this.send(
            email,
            'Reset your BuildVerdict password',
            createElement(PasswordResetEmail, { link }),
        );
    }

    private async send(
        to: string,
        subject: string,
        template: ReactElement,
    ): Promise<void> {
        const [html, text] = await Promise.all([
            render(template),
            render(template, { plainText: true }),
        ]);

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                await this.mailerService.sendMail({ to, subject, html, text });

                if (attempt > 1) {
                    this.logger.log(
                        `Sent "${subject}" to ${to} on attempt ${attempt}.`,
                    );
                }

                return;
            } catch (error) {
                const retryable =
                    attempt < MAX_ATTEMPTS && isRetryableDeliveryError(error);

                if (!retryable) {
                    this.logger.error(
                        `Giving up on "${subject}" to ${to} after ${attempt} attempt(s).`,
                        error,
                    );

                    throw new MailDeliveryError(to, subject, { cause: error });
                }

                this.logger.warn(
                    `Attempt ${attempt} to send "${subject}" to ${to} failed, retrying.`,
                );

                await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
            }
        }
    }

    private frontendLink(path: string, token: string): string {
        const [origin] = parseAllowedOrigins(
            this.configService.getOrThrow<string>('ALLOWED_ORIGIN'),
        );

        return `${origin}${path}?token=${encodeURIComponent(token)}`;
    }
}
