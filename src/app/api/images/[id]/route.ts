import { db } from "elestampadero/server/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-z0-9-]{10,60}$/i.test(id)) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  const [image] = await db.$queryRaw<
    Array<{ data: Buffer; mimeType: string; size: number }>
  >`
    SELECT "data", "mimeType", "size"
    FROM "UploadedImage"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  if (!image) return new Response("Imagen no encontrada", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
