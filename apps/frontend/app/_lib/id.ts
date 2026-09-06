export function createId(prefix: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  return `${prefix}-${suffix}`;
}
