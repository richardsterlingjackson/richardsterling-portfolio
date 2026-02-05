export function checkAdmin(req: Request) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return new Response(JSON.stringify({ error: "Admin token not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("x-admin-token");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let token = authHeader;
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (token !== adminToken) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}
