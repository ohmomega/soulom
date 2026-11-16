export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (declaredLength > maxBytes) return null;
  const rawBody = await request.text();
  if (rawBody.length > maxBytes) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function fingerprintClient(request: Request): Promise<string> {
  const forwardedFor = request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim();
  const clientAddress = request.headers.get("CF-Connecting-IP") ?? forwardedFor ?? "local";
  const digest = await sha256Hex(`soulom-client:${clientAddress}`);
  return digest.slice(0, 32);
}
