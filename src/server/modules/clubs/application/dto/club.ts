export interface ClubSummaryDto {
  id: string;
  slug: string;
  name: string;
  sport: string | null;
  logoUrl: string | null;
  isActive: boolean;
  payoutCbu: string | null;
  mobbexEntityId: string | null;
  mobbexSubmittedEntityId: string | null;
  mobbexOnboardingStatus:
    | "NOT_STARTED"
    | "REGISTRATION_PENDING"
    | "DETAILS_SUBMITTED"
    | "ACCESS_REQUESTED"
    | "AUTHORIZATION_CONFIRMED"
    | "ACTIVE";
  mobbexTaxId: string | null;
  mobbexLegalName: string | null;
  mobbexContactName: string | null;
  mobbexContactEmail: string | null;
  mobbexContactPhone: string | null;
  mobbexSubmittedAt: string | null;
  mobbexAccessRequestedAt: string | null;
  mobbexAuthorizationConfirmedAt: string | null;
  mobbexActivatedAt: string | null;
  productCount: number;
  hasActiveAgreement: boolean;
}

export interface ClubDetailDto extends ClubSummaryDto {
  description: string | null;
  createdAt: string;
}
