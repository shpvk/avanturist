export interface MuteFields {
    mutedAt: Date | null;
    mutedUntil: Date | null;
}

export function isMuted(user: MuteFields, now: Date = new Date()): boolean {
    if (!user.mutedAt) {
        return false;
    }

    return !user.mutedUntil || user.mutedUntil > now;
}
