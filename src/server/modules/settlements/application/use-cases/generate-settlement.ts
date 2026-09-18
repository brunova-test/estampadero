import "server-only";

import type { SettlementGenerationResultDto } from "../dto/settlement";
import type { SettlementsRepository } from "../ports/settlements-repository";
import { resolveCompletedSettlementPeriod } from "./settlement-period";

export function generateDueSettlements(repository: SettlementsRepository) {
  return async (
    createdByUserId: string,
    now = new Date(),
  ): Promise<SettlementGenerationResultDto> => {
    const configurations = await repository.listSettlementConfigurations();
    const created: SettlementGenerationResultDto["created"] = [];
    const skipped: SettlementGenerationResultDto["skipped"] = [];

    const automatic = configurations.filter(
      (configuration) => configuration.frequency === "AUTOMATIC",
    );
    if (automatic.length > 0 && repository.generateAutomaticSettlements) {
      const automaticSettlements = await repository.generateAutomaticSettlements(
        createdByUserId,
        now,
      );
      created.push(...automaticSettlements);
    }

    for (const configuration of configurations.filter(
      (item) => item.frequency !== "AUTOMATIC",
    )) {
      if (!configuration.payoutCbu) {
        skipped.push({
          clubId: configuration.clubId,
          clubName: configuration.clubName,
          reason: "Falta configurar el CBU/CVU.",
        });
        continue;
      }

      const period = resolveCompletedSettlementPeriod(
        configuration.frequency,
        now,
      );
      const settlement = await repository.generateSettlement(
        configuration.clubId,
        period.periodLabel,
        period.periodStart,
        period.periodEnd,
        period.cutoffExclusive,
        createdByUserId,
      );
      if (settlement) created.push(settlement);
      else {
        skipped.push({
          clubId: configuration.clubId,
          clubName: configuration.clubName,
          reason: "No tiene comisiones pendientes para el período cerrado.",
        });
      }
    }

    return { created, skipped };
  };
}
