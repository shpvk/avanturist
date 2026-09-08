export function reputationValue(reputation: string): number {
  return Number(reputation.replaceAll(/\D/g, "")) || 0;
}

export function plural(count: number, one: string, many: string): string {
  return Math.abs(count) === 1 ? one : many;
}

export function commentsLabel(count: number): string {
  return `${count} ${plural(count, "comment", "comments")}`;
}

export function formatMinutes(total: number): string {
  if (total % 1_440 === 0) {
    const days = total / 1_440;
    return `${days} ${plural(days, "day", "days")}`;
  }

  if (total % 60 === 0) {
    const hours = total / 60;
    return `${hours} ${plural(hours, "hour", "hours")}`;
  }

  return `${total} ${plural(total, "minute", "minutes")}`;
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "";
  return `${trimmed[0]}${"*".repeat(8)}`;
}
