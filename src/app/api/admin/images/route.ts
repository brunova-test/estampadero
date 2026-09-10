import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { auth } from "elestampadero/server/auth";
import { db } from "elestampadero/server/db";
import { checkRateLimit } from "elestampadero/server/security/rate-limit";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  safeImageFilename,
  validateImageUpload,
} from "elestampadero/server/security/image-upload";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const MAX_MULTIPART_BYTES = MAX_IMAGE_UPLOAD_BYTES + 512 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_MULTIPART_BYTES) {
    return NextResponse.json(
      { error: "La imagen no puede superar los 5 MB." },
      { status: 413 },
    );
  }

  const rateLimit = await checkRateLimit(
    `admin:image-upload:${session.user.id}`,
    30,
    60 * 60_000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Alcanzaste el límite temporal de imágenes." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "Seleccioná una imagen para subir." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const validation = validateImageUpload({
    name: image.name,
    declaredMime: image.type,
    size: image.size,
    bytes,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const imageId = randomUUID();
  await db.$executeRaw`
    INSERT INTO "UploadedImage" ("id", "originalName", "mimeType", "size", "data")
    VALUES (
      ${imageId},
      ${safeImageFilename(image.name)},
      ${validation.mimeType},
      ${image.size},
      ${Buffer.from(bytes)}
    )
  `;

  return NextResponse.json({ url: `/api/images/${imageId}` }, { status: 201 });
}
