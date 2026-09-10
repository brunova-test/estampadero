export interface DesignVersionDto {
  id: string;
  versionNumber: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  imageUrls: string[];
  status: string;
  changeNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignCommentDto {
  id: string;
  versionId: string | null;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface LinkedProductDto {
  productId: string;
  productName: string;
}

export interface DesignSummaryDto {
  id: string;
  clubId: string | null;
  clubName: string;
  clubSlug: string | null;
  customerName: string | null;
  title: string;
  status: string;
  latestVersionNumber: number;
  createdAt: string;
}

export interface DesignDetailDto extends DesignSummaryDto {
  versions: DesignVersionDto[];
  comments: DesignCommentDto[];
  linkedProducts: LinkedProductDto[];
}
