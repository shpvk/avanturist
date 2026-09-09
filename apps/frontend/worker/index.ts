import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface AssetFetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface Env {
  ASSETS: AssetFetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const dotaCdnOrigin = "https://cdn.cloudflare.steamstatic.com";

const apiOrigin = (() => {
  const configured = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL;
  try {
    return new URL(configured ?? "http://localhost:4000").origin;
  } catch {
    return "http://localhost:4000";
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${dotaCdnOrigin} ${apiOrigin}`,
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `connect-src 'self' blob: data: ${apiOrigin}`,
].join("; ");

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    responseHeaders.set("Content-Security-Policy", contentSecurityPolicy);
    responseHeaders.set("X-Frame-Options", "DENY");
    responseHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    if (url.protocol === "https:") {
      responseHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};

export default worker;
