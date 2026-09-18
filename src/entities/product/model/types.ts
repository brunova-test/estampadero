export interface ProductSummary {
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
  variants: ProductVariant[];
  defaultVariant: { id: string; size: string; color: string } | null;
  createdAt: Date;
  club: { slug: string; name: string; logoUrl: string | null } | null;
  category: { slug: string; name: string } | null;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number | null;
}

export interface ProductDetail {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string | null;
  priceInCents: number;
  compareAtCents: number | null;
  line: string | null;
  allowsCustomPrint: boolean;
  showStock: boolean;
  images: { url: string; alt: string | null; color: string | null }[];
  variants: ProductVariant[];
  club: { slug: string; name: string; logoUrl: string | null } | null;
  category: { slug: string; name: string } | null;
}
