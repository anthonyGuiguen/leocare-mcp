import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Origines autorisées à appeler ce serveur MCP depuis un navigateur.
// Les appels serveur-à-serveur (ChatGPT, Claude) ignorent CORS — cette liste
// protège uniquement contre les scripts JS malveillants dans un navigateur.
const ALLOWED_ORIGINS = [
  "https://chatgpt.com",
  "https://chat.openai.com",
  "https://claude.ai",
  "https://leocare-mcp.vercel.app",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

// Rate limiting : 10 requêtes POST /mcp par heure par IP
// Protège l'API Coherent contre les abus
let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // désactivé si variables absentes
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, "1 h"),
    prefix: "leocare_mcp",
  });
  return ratelimit;
}

function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : "";
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request);

  // Preflight OPTIONS — pas de rate limiting
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (allowedOrigin) response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // Rate limiting uniquement sur POST /mcp
  if (request.method === "POST" && request.nextUrl.pathname.startsWith("/mcp")) {
    const rl = getRatelimit();
    if (rl) {
      const ip = getClientIp(request);
      const { success, remaining, reset } = await rl.limit(ip);

      if (!success) {
        const response = new NextResponse(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32029,
              message: "Trop de requêtes. Réessaie dans quelques minutes.",
            },
            id: null,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
        if (allowedOrigin) response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
        response.headers.set("Retry-After", String(Math.ceil((reset - Date.now()) / 1000)));
        return response;
      }

      const response = NextResponse.next();
      if (allowedOrigin) response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      for (const [key, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(key, value);
      }
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      return response;
    }
  }

  const response = NextResponse.next();
  if (allowedOrigin) response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/:path*",
};
