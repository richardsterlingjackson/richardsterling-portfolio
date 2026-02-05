export const runtime = "nodejs";

import crypto from "crypto";

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "Cloudinary env not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "shared-experiences";

  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

  return new Response(
    JSON.stringify({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
