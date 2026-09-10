import "server-only";

import { TRPCError } from "@trpc/server";

import type {
  CreateOrderInput,
  OrderDetailDto,
} from "elestampadero/server/modules/orders";
import type { VariantForPricingDto } from "elestampadero/server/modules/catalog";

const FLAT_SHIPPING_IN_CENTS = 620_000;
const MAX_LINE_QUANTITY = 20;

export interface SubmitCheckoutLineInput {
  variantId: string;
  quantity: number;
}

export interface SubmitCheckoutInput {
  checkoutRequestId: string;
  userId: string | null;
  contactName: string;
  customerDocument: string | null;
  contactEmail: string;
  contactPhone: string;
  deliveryMethod: "SHIPPING" | "PICKUP";
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  lines: SubmitCheckoutLineInput[];
}

interface SubmitCheckoutDeps {
  getVariantsForPricing: (
    variantIds: string[],
  ) => Promise<VariantForPricingDto[]>;
  createOrder: (input: CreateOrderInput) => Promise<OrderDetailDto>;
}

export function submitCheckout(deps: SubmitCheckoutDeps) {
  return async (input: SubmitCheckoutInput): Promise<OrderDetailDto> => {
    if (input.lines.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "El carrito está vacío.",
      });
    }

    if (input.deliveryMethod === "SHIPPING" && !input.shippingAddress) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Falta la dirección de envío.",
      });
    }

    const variants = await deps.getVariantsForPricing(
      input.lines.map((line) => line.variantId),
    );
    const variantById = new Map(
      variants.map((variant) => [variant.variantId, variant]),
    );

    const items = input.lines.map((line) => {
      const variant = variantById.get(line.variantId);
      if (!variant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uno de los productos ya no está disponible.",
        });
      }
      if (line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cantidad inválida.",
        });
      }
      if (
        variant.showStock &&
        variant.stock !== null &&
        variant.stock < line.quantity
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Sin stock suficiente para ${variant.productName} (talle ${variant.size}, color ${variant.color}).`,
        });
      }

      return {
        productId: variant.productId,
        productName: variant.productName,
        productSlug: variant.productSlug,
        variantId: variant.variantId,
        size: variant.size,
        color: variant.color,
        imageUrl: variant.imageUrl,
        priceInCentsSnapshot: variant.priceInCents,
        quantity: line.quantity,
        lineTotalInCents: variant.priceInCents * line.quantity,
        stockControlled: variant.showStock && variant.stock !== null,
        clubId: variant.clubId,
        clubNameSnapshot: variant.clubName,
      };
    });

    const subtotalInCents = items.reduce(
      (sum, item) => sum + item.lineTotalInCents,
      0,
    );
    const shippingInCents =
      input.deliveryMethod === "SHIPPING" ? FLAT_SHIPPING_IN_CENTS : 0;

    return deps.createOrder({
      checkoutRequestId: input.checkoutRequestId,
      userId: input.userId,
      contactName: input.contactName,
      customerDocument: input.customerDocument,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      deliveryMethod: input.deliveryMethod,
      shippingAddress: input.shippingAddress,
      shippingCity: input.shippingCity,
      shippingPostalCode: input.shippingPostalCode,
      subtotalInCents,
      shippingInCents,
      totalInCents: subtotalInCents + shippingInCents,
      items,
    });
  };
}
