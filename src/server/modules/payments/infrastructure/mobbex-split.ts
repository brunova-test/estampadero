import "server-only";

import { TRPCError } from "@trpc/server";

import { env } from "elestampadero/env";
import { resolveRateForProductUseCase } from "elestampadero/server/modules/agreements";
import type { OrderDetailDto } from "elestampadero/server/modules/orders";
import { db } from "elestampadero/server/db";

import type { CreateCheckoutSessionInput } from "../application/ports/payment-gateway";

type SplitItem = NonNullable<CreateCheckoutSessionInput["split"]>[number];

/**
 * Freezes the commercial agreement into the Mobbex checkout. Each club entry
 * covers the gross value of its lines; fee is the store's share and the
 * remainder is what Mobbex sends to the club. Store-only lines and shipping
 * are assigned to the originator entity so split totals equal the order total.
 */
export async function buildMobbexSplit(
  order: OrderDetailDto,
): Promise<CreateCheckoutSessionInput["split"]> {
  const clubLines = order.items.filter(
    (item): item is typeof item & { clubId: string } => item.clubId !== null,
  );
  if (clubLines.length === 0) return undefined;

  const clubIds = [...new Set(clubLines.map((item) => item.clubId))];
  const clubs = await db.club.findMany({
    where: { id: { in: clubIds } },
    select: { id: true, name: true, mobbexEntityId: true },
  });
  const clubById = new Map(clubs.map((club) => [club.id, club]));
  const grouped = new Map<string, { gross: number; clubAmount: number }>();

  for (const line of clubLines) {
    const club = clubById.get(line.clubId);
    if (!club?.mobbexEntityId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `${club?.name ?? "Un club del pedido"} todavía no tiene configurada su entidad de Mobbex.`,
      });
    }
    const rate = await resolveRateForProductUseCase(
      line.clubId,
      line.productId,
    );
    if (!rate) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `${club.name} no tiene un convenio activo para este producto.`,
      });
    }
    const current = grouped.get(line.clubId) ?? { gross: 0, clubAmount: 0 };
    current.gross += line.lineTotalInCents;
    current.clubAmount += Math.round(
      (line.lineTotalInCents * rate.percentage) / 100,
    );
    grouped.set(line.clubId, current);
  }

  const split: SplitItem[] = [...grouped.entries()].map(([clubId, amount]) => {
    const club = clubById.get(clubId)!;
    return {
      entity: club.mobbexEntityId!,
      totalInCents: amount.gross,
      feeInCents: amount.gross - amount.clubAmount,
      reference: `order-${order.orderNumber}-club-${clubId}`,
      description: `Participación ${club.name} · Pedido #${order.orderNumber}`,
    };
  });

  const assignedToClubs = split.reduce(
    (total, item) => total + item.totalInCents,
    0,
  );
  const originatorAmount = order.totalInCents - assignedToClubs;
  if (originatorAmount < 0) {
    throw new Error("El split calculado supera el total del pedido.");
  }
  if (originatorAmount > 0) {
    if (!env.MOBBEX_ENTITY_ID) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Falta configurar la entidad Mobbex de El Estampadero para productos propios y envío.",
      });
    }
    split.push({
      entity: env.MOBBEX_ENTITY_ID,
      totalInCents: originatorAmount,
      feeInCents: 0,
      reference: `order-${order.orderNumber}-store`,
      description: `Productos propios y envío · Pedido #${order.orderNumber}`,
    });
  }

  if (split.length > 50) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "El pedido supera el máximo de 50 entidades permitido por Mobbex.",
    });
  }
  if (
    split.reduce((total, item) => total + item.totalInCents, 0) !==
    order.totalInCents
  ) {
    throw new Error(
      "Los importes del split no coinciden con el total del pedido.",
    );
  }
  return split;
}
