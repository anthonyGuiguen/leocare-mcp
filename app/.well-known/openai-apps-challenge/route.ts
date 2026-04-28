import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.OPENAI_DOMAIN_CHALLENGE;

  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(token, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
