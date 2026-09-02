/** Поля мута в том виде, в каком они лежат у пользователя. */
export interface MuteFields {
    mutedAt: Date | null;
    mutedUntil: Date | null;
}

/**
 * Мут действует, пока не истёк срок. Бессрочный — это `mutedAt` без
 * `mutedUntil`: далёкая дата вместо пустого поля сделала бы «навсегда»
 * неотличимым от «до 2099 года».
 */
export function isMuted(user: MuteFields, now: Date = new Date()): boolean {
    if (!user.mutedAt) {
        return false;
    }

    return !user.mutedUntil || user.mutedUntil > now;
}
