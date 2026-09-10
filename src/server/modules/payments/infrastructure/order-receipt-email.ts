import "server-only";

import { env } from "elestampadero/env";
import { db } from "elestampadero/server/db";
import type { OrderDetailDto } from "elestampadero/server/modules/orders";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

function formatMoney(valueInCents: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valueInCents / 100);
}

function buildReceiptHtml(order: OrderDetailDto): string {
  const orderNumber = String(order.orderNumber).padStart(6, "0");
  const receiptUrl = `${env.APP_URL}/pedido/${order.id}`;
  const delivery =
    order.deliveryMethod === "SHIPPING"
      ? `${order.shippingAddress ?? ""}, ${order.shippingCity ?? ""} (${order.shippingPostalCode ?? ""})`
      : "Retiro en el taller · Paraguay 95";
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e8e5ed">
            <strong>${escapeHtml(item.productName)}</strong><br>
            <span style="color:#615a70">Talle ${escapeHtml(item.size)} · ${escapeHtml(item.color)} · ${item.quantity} u.</span>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e8e5ed;text-align:right;font-weight:700;color:#2e0470">
            ${formatMoney(item.lineTotalInCents)}
          </td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="es">
    <body style="margin:0;background:#f7f6f9;color:#0e0a1a;font-family:Arial,sans-serif">
      <div style="max-width:680px;margin:0 auto;padding:32px 16px">
        <div style="background:#2e0470;padding:24px;color:#fff">
          <p style="margin:0 0 8px;color:#80ffdb;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Pago confirmado</p>
          <h1 style="margin:0;font-size:28px">Comprobante de compra</h1>
          <p style="margin:8px 0 0;color:#ded6f2">Pedido #${orderNumber}</p>
        </div>
        <div style="background:#fff;padding:24px">
          <p>Hola ${escapeHtml(order.contactName)}, recibimos correctamente tu pago.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
          <div style="margin-top:20px;padding-top:16px;border-top:2px solid #2e0470">
            <p style="margin:5px 0">Subtotal: <strong>${formatMoney(order.subtotalInCents)}</strong></p>
            <p style="margin:5px 0">Envío: <strong>${order.shippingInCents > 0 ? formatMoney(order.shippingInCents) : "Sin costo"}</strong></p>
            <p style="margin:10px 0 0;font-size:20px;color:#2e0470">Total pagado: <strong>${formatMoney(order.totalInCents)}</strong></p>
          </div>
          <div style="margin-top:20px;padding:16px;background:#f7f6f9">
            <strong>Entrega</strong><br>${escapeHtml(delivery)}<br>
            <span style="color:#615a70">Contacto: ${escapeHtml(order.contactEmail)} · ${escapeHtml(order.contactPhone)}</span>
          </div>
          <p style="margin:24px 0 0">
            <a href="${receiptUrl}" style="display:inline-block;background:#80ffdb;color:#2e0470;padding:12px 18px;font-weight:700;text-decoration:none">Ver comprobante en la web</a>
          </p>
        </div>
      </div>
    </body>
  </html>`;
}

export async function sendOrderReceiptEmail(
  order: OrderDetailDto,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RECEIPT_EMAIL_FROM) {
    console.warn(
      `[receipt email] RESEND_API_KEY or RECEIPT_EMAIL_FROM is not configured; order ${order.id} was not emailed.`,
    );
    return;
  }

  const receiptState = await db.order.findUnique({
    where: { id: order.id },
    select: { receiptEmailSentAt: true },
  });
  if (receiptState?.receiptEmailSentAt) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `order-receipt-${order.id}`,
    },
    body: JSON.stringify({
      from: env.RECEIPT_EMAIL_FROM,
      to: [order.contactEmail],
      subject: `Comprobante de compra · Pedido #${String(order.orderNumber).padStart(6, "0")}`,
      html: buildReceiptHtml(order),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend rejected receipt email (${response.status}): ${detail}`);
  }

  const result = (await response.json()) as { id?: string };
  await db.order.updateMany({
    where: { id: order.id, receiptEmailSentAt: null },
    data: {
      receiptEmailSentAt: new Date(),
      receiptEmailProviderId: result.id ?? null,
    },
  });
}
