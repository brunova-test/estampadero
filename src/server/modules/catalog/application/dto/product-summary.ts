export interface ProductSummaryDto {
  id: string;
  slug: string;
  code: string;
  name: string;
  priceInCents: number;
  compareAtCents: number | null;
  line: string | null;
  allowsCustomPrint: boolean;
  isFeatured: boolean;
  showStock: boolean;
  imageUrl: string | null;
  imageUrls: string[];
  images: { url: string; color: string | null }[];
  totalStock: number;
  colors: string[];
  variants: { id: string; size: string; color: string; stock: number | null }[];
  defaultVariant: { id: string; size: string; color: string } | null;
  createdAt: Date;
  club: { slug: string; name: string; logoUrl: string | null } | null;
  category: { slug: string; name: string } | null;
}
