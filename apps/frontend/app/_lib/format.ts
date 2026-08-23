/** Reputation is stored as display text ("1 245"), so sorting needs the number back. */
export function reputationValue(reputation: string): number {
  return Number(reputation.replaceAll(/\D/g, "")) || 0;
}

/** Russian plural for "комментарий": 1 комментарий, 2 комментария, 5 комментариев. */
export function commentsLabel(count: number): string {
  const lastTwoDigits = Math.abs(count) % 100;
  const lastDigit = lastTwoDigits % 10;
  const isTeen = lastTwoDigits >= 11 && lastTwoDigits <= 14;
  const word = isTeen || lastDigit === 0 || lastDigit >= 5
    ? "комментариев"
    : lastDigit === 1
      ? "комментарий"
      : "комментария";
  return `${count} ${word}`;
}
