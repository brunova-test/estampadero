import "server-only";

import { TRPCError } from "@trpc/server";

import type { SettlementsRepository } from "../ports/settlements-repository";

export function markSettlementPaid(repository: SettlementsRepository) {
  return async (input: {
    settlementId: string;
    receiptUrl: string;
    confirmedByUserId: string;
  }): Promise<void> => {
    if (!input.receiptUrl) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Debés adjuntar el comprobante antes de confirmar el pago.",
      });
    }
    const settlement = await repository.getById(input.settlementId);
    if (!settlement) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Liquidación no encontrada.",
      });
    }
    if (!settlement.payoutCbu) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "El club no tiene un CBU/CVU configurado.",
      });
    }
    const wasMarked = await repository.markPaid(input);
    if (!wasMarked) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Esta liquidación ya fue pagada o cancelada.",
      });
    }
  };
}
