
import { ImageResponse } from "@vercel/og";

// 1x1 transparent PNG (base64)
const EMPTY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2l2ZkAAAAASUVORK5CYII=",
  "base64"
);

export const runtime = "edge";


export async function GET(req: Request) {
  try {
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
    // Always return a valid PNG image, even on error
    return new Response(EMPTY_PNG, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
}

// Facebook and other bots may send HEAD requests. Always return a valid PNG.
export async function HEAD() {
  return new Response(EMPTY_PNG, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
    },
  });
}
