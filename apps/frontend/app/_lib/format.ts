/** Reputation is stored as display text ("1 245"), so sorting needs the number back. */
export function reputationValue(reputation: string): number {
  return Number(reputation.replaceAll(/\D/g, "")) || 0;
}

/** Russian plural: picks between "1 комментарий", "2 комментария", "5 комментариев". */
export function plural(count: number, one: string, few: string, many: string): string {
  const lastTwoDigits = Math.abs(count) % 100;
  const lastDigit = lastTwoDigits % 10;
  const isTeen = lastTwoDigits >= 11 && lastTwoDigits <= 14;
  if (isTeen || lastDigit === 0 || lastDigit >= 5) return many;
  return lastDigit === 1 ? one : few;
}

export function commentsLabel(count: number): string {
  return `${count} ${plural(count, "комментарий", "комментария", "комментариев")}`;
}

/**
 * Срок мута словами: «30 минут», «12 часов», «7 дней». Диалог показывает
 * длительность, а не дату — часы на сервере всё равно свои.
 */
export function formatMinutes(total: number): string {
  if (total % 1_440 === 0) {
    const days = total / 1_440;
    return `${days} ${plural(days, "день", "дня", "дней")}`;
  }

  if (total % 60 === 0) {
    const hours = total / 60;
    return `${hours} ${plural(hours, "час", "часа", "часов")}`;
  }

  return `${total} ${plural(total, "минуту", "минуты", "минут")}`;
}
