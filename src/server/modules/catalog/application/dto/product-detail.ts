export interface ProductVariantDto {
  id: string;
  size: string;
  color: string;
  stock: number | null;
}

export interface ProductDetailDto {
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
  variants: ProductVariantDto[];
  club: { slug: string; name: string } | null;
  category: { slug: string; name: string } | null;
}
