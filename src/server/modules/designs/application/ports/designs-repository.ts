import type { DesignDetailDto, DesignSummaryDto } from "../dto/design";

export type DesignStatusValue =
  "PENDING_SEND" | "SENT_TO_CLUB" | "CHANGES_REQUESTED" | "APPROVED";

export interface DesignsRepository {
  listAll(): Promise<DesignSummaryDto[]>;
  listByClub(clubId: string): Promise<DesignSummaryDto[]>;
  getById(id: string): Promise<DesignDetailDto | null>;
  createDesign(input: {
    clubId?: string;
    customerName?: string;
    title: string;
    imageUrl: string;
    imageUrls?: string[];
  }): Promise<DesignDetailDto>;
  addVersion(
    designId: string,
    input: { title: string; description: string; imageUrl: string },
  ): Promise<DesignDetailDto>;
  updateVersion(input: {
    designId: string;
    versionId: string;
    imageUrl: string;
    changeNote: string;
    authorUserId: string;
    authorName: string;
  }): Promise<DesignDetailDto>;
  setStatus(designId: string, status: DesignStatusValue, versionId?: string): Promise<void>;
  addComment(input: {
    designId: string;
    versionId?: string;
    authorUserId: string;
    authorName: string;
    message: string;
  }): Promise<void>;
  linkProduct(designId: string, productId: string): Promise<void>;
  unlinkProduct(designId: string, productId: string): Promise<void>;
}
