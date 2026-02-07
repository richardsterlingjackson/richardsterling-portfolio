// Debug-safe OG endpoint: returns tiny PNG and logs headers to Vercel logs.
const EMPTY_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2l2ZkAAAAASUVORK5CYII=";

function b64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    return Buffer.from(b64, "base64");
  }
  const atobFn = typeof atob === "function" ? atob : (globalThis as any).atob;
  const bin = atobFn(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    // Log headers so the Vercel logs will show user-agent and any other header differences
    console.error("OG GET headers:", Object.fromEntries(req.headers.entries()));

    const bytes = b64ToBytes(EMPTY_B64);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("OG debug fallback error:", err);
    return new Response("error", { status: 500 });
  }
}

export async function HEAD() {
  try {
    const bytes = b64ToBytes(EMPTY_B64);
    console.error("OG HEAD invoked");
    return new Response(bytes, {
      status: 200,
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=60" },
    });
  } catch (err) {
    console.error("OG HEAD fallback error:", err);
    return new Response("error", { status: 500 });
  }
}