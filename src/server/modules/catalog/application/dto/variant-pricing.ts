export interface VariantForPricingDto {
  variantId: string;
  size: string;
  color: string;
  stock: number | null;
  showStock: boolean;
  productId: string;
  productName: string;
  productSlug: string;
  priceInCents: number;
  imageUrl: string | null;
  clubId: string | null;
  clubName: string | null;
}
