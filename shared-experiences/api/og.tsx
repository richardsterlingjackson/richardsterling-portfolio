export const config = {
  runtime: "edge",
};

const EMPTY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2l2ZkAAAAASUVORK5CYII=";

// Convert base64 to bytes in a runtime-safe way (avoid Buffer at module init)
function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    return Buffer.from(b64, "base64");
  }
  const atobFn = typeof atob === "function" ? atob : (globalThis as any).atob;
  if (typeof atobFn === "function") {
    const binary = atobFn(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Fallback: decode manually (very small string so acceptable)
  let binary = "";
  for (let i = 0; i < b64.length; i++) {
    binary += String.fromCharCode(b64.charCodeAt(i));
  }
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getEmptyPngBytes(): Uint8Array {
  try {
    return base64ToBytes(EMPTY_PNG_BASE64);
  } catch (err) {
    // Safeguard: log and return minimal empty array so we don't throw during runtime
    console.error("base64ToBytes failed:", err);
    return new Uint8Array(0);
  }
}

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { ImageResponse } = await import("@vercel/og");
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Shared Experiences";
    const category = searchParams.get("category") || "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px",
            background: "linear-gradient(135deg, #f3e8dc 0%, #f8f4ef 100%)",
            color: "#5b4636",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </div>
          {category ? (
            <div style={{ marginTop: 24, fontSize: 24, letterSpacing: 2, textTransform: "uppercase" }}>
              {category}
            </div>
          ) : null}
          <div style={{ marginTop: 32, fontSize: 20, opacity: 0.7 }}>
            Shared Experiences
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
    );
  } catch (err: any) {
    // Log the real error so you can inspect Vercel logs
    console.error("OG image generation error:", err);
    const EMPTY_PNG = getEmptyPngBytes();
    return new Response(EMPTY_PNG, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}

// Do not declare unused parameters to avoid TS6133.
// HEAD returns a tiny PNG so crawlers that probe HEAD see an image content-type.
export async function HEAD() {
  const EMPTY_PNG = getEmptyPngBytes();
  return new Response(EMPTY_PNG, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
    },
  });
}
