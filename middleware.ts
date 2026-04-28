import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get("origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : "";
}

export function middleware(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (allowedOrigin) response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
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
