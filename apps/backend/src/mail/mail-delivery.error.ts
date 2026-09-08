export class MailDeliveryError extends Error {
    public constructor(
        public readonly recipient: string,
        public readonly subject: string,
        options?: { cause?: unknown },
    ) {
        super(`Failed to deliver "${subject}" to ${recipient}.`, options);

        this.name = 'MailDeliveryError';
    }
}
