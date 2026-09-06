const configuredApiUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL;

export const apiBaseUrl: string = configuredApiUrl ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
