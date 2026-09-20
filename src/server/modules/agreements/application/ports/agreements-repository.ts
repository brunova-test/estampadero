import type { AgreementDetailDto, AgreementSummaryDto } from "../dto/agreement";

export interface CreateAgreementInput {
  clubId: string;
  code: string;
  title: string;
  startDate: Date;
  endDate: Date;
  basePercentage: number;
  settlementMethod: "TRANSFER" | "SPLIT_MP";
  settlementFrequency: "AUTOMATIC" | "BIWEEKLY" | "MONTHLY";
  contractUrl: string | null;
  productRates: { productId: string; percentage: number }[];
  changedByUserId: string;
}

export interface UpdateAgreementInput extends Omit<
  CreateAgreementInput,
  "clubId"
> {
  id: string;
}

export type AgreementAction =
  "CREATED" | "UPDATED" | "PAUSED" | "REACTIVATED" | "CANCELLED";

export interface ChangeAgreementStatusInput {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  action: Exclude<AgreementAction, "CREATED" | "UPDATED">;
  changedByUserId: string;
}

export interface ResolvedRate {
  agreementId: string;
  percentage: number;
}

export interface AgreementsRepository {
  listByClub(clubId: string): Promise<AgreementSummaryDto[]>;
  getById(id: string): Promise<AgreementDetailDto | null>;
  getActiveForClub(clubId: string): Promise<AgreementDetailDto | null>;
  createAgreement(input: CreateAgreementInput): Promise<AgreementDetailDto>;
  updateAgreement(input: UpdateAgreementInput): Promise<AgreementDetailDto>;
  changeStatus(input: ChangeAgreementStatusInput): Promise<AgreementDetailDto>;
  setProductRate(
    agreementId: string,
    productId: string,
    percentage: number,
    changedByUserId: string,
  ): Promise<void>;






  resolveRateForProduct(
    clubId: string,
    productId: string,
  ): Promise<ResolvedRate | null>;
}
