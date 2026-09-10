import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { auth } from "elestampadero/server/auth";
import { db } from "elestampadero/server/db";
import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  safeDocumentFilename,
  validateDocumentUpload,
} from "elestampadero/server/security/document-upload";
import { checkRateLimit } from "elestampadero/server/security/rate-limit";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const MAX_MULTIPART_BYTES = MAX_DOCUMENT_UPLOAD_BYTES + 512 * 1024;

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
      { error: "El comprobante no puede superar los 5 MB." },
      { status: 413 },
    );
  }

  const rateLimit = await checkRateLimit(
    `admin:document-upload:${session.user.id}`,
    30,
    60 * 60_000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Alcanzaste el límite temporal de comprobantes." },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const document = formData.get("document");
  if (!(document instanceof File)) {
    return NextResponse.json(
      { error: "Seleccioná un comprobante para subir." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await document.arrayBuffer());
  const validation = validateDocumentUpload({
    name: document.name,
    declaredMime: document.type,
    size: document.size,
    bytes,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const documentId = randomUUID();
  await db.uploadedDocument.create({
    data: {
      id: documentId,
      originalName: safeDocumentFilename(document.name),
      mimeType: validation.mimeType,
      size: document.size,
      data: Buffer.from(bytes),
    },
  });

  return NextResponse.json(
    { url: `/api/documents/${documentId}` },
    { status: 201 },
  );
}
