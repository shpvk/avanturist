/**
 * Base URL of the Nest API (`apps/backend`). Override with VITE_API_URL;
 * the default matches APPLICATION_PORT from the repository .env.
 */
const configuredApiUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL;

export const apiBaseUrl: string = configuredApiUrl ?? "http://localhost:4000";

/** A response the API actually rejected — as opposed to it being unreachable. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
