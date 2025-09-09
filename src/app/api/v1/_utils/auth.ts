import { prisma } from "@/lib/prisma";

export async function getClientIdFromAuth(req: Request): Promise<string | null> {
  // Prefer Bearer token: Authorization: Bearer <clientId>
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // Fallback to cookie named client_id
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)client_id=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

export async function requireClient(req: Request) {
  const clientId = await getClientIdFromAuth(req);
  if (!clientId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, isActive: true },
  });
  if (!client) return { ok: false as const, status: 401, error: "Invalid user" };
  if (!client.isActive) return { ok: false as const, status: 403, error: "Inactive user" };
  return { ok: true as const, client };
}

