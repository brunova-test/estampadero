import { auth } from "elestampadero/server/auth";
import { db } from "elestampadero/server/db";

const ALLOWED_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(session.user.role)) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;
  if (!/^[a-z0-9-]{10,60}$/i.test(id)) {
    return new Response("Comprobante no encontrado", { status: 404 });
  }

  const document = await db.uploadedDocument.findUnique({ where: { id } });
  if (!document) {
    return new Response("Comprobante no encontrado", { status: 404 });
  }

  return new Response(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(document.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
