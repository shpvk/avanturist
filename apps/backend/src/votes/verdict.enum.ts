/** Оценка билда сообществом. Значения совпадают с теми, что использует фронтенд. */
export enum Verdict {
    Positive = 'positive',
    Situational = 'situational',
    Negative = 'negative',
}

export type VerdictCounts = Record<Verdict, number>;

export const emptyVerdictCounts = (): VerdictCounts => ({
    [Verdict.Positive]: 0,
    [Verdict.Situational]: 0,
    [Verdict.Negative]: 0,
});
