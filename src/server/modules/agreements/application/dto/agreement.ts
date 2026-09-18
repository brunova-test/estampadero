export interface AgreementSummaryDto {
  id: string;
  code: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  basePercentage: number;
  settlementMethod: string;
  settlementFrequency: string;
  contractUrl: string | null;
}

export interface AgreementProductRateDto {
  id: string;
  productId: string;
  productName: string;
  percentage: number;
}

export interface AgreementChangeDto {
  id: string;
  action: string;
  summary: string;
  changedByUserId: string | null;
  createdAt: string;
}

export interface AgreementDetailDto extends AgreementSummaryDto {
  clubId: string;
  productRates: AgreementProductRateDto[];
  changes: AgreementChangeDto[];
}
