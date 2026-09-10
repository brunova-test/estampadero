import {
  createTRPCRouter,
  getClientIp,
  publicProcedure,
  rateLimit,
} from "elestampadero/server/api/trpc";
import { createOrderUseCase } from "elestampadero/server/modules/orders";
import { getVariantsForPricingUseCase } from "elestampadero/server/modules/catalog";

import { submitCheckout } from "../application/use-cases/submit-checkout";
import { submitCheckoutInputSchema } from "./schemas";

const submitCheckoutUseCase = submitCheckout({
  getVariantsForPricing: getVariantsForPricingUseCase,
  createOrder: createOrderUseCase,
});

export const checkoutRouter = createTRPCRouter({
  submit: publicProcedure
    .input(submitCheckoutInputSchema)
    .use(
      rateLimit({
        limit: 10,
        windowMs: 10 * 60_000,
        key: ({ ctx }) => `checkout:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ ctx, input }) =>
      submitCheckoutUseCase({
        checkoutRequestId: input.checkoutRequestId,
        userId: ctx.session?.user.id ?? null,
        contactName: input.contactName,
        customerDocument: input.customerDocument ?? null,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        deliveryMethod: input.deliveryMethod,
        shippingAddress: input.shippingAddress ?? null,
        shippingCity: input.shippingCity ?? null,
        shippingPostalCode: input.shippingPostalCode ?? null,
        lines: input.lines,
      }),
    ),
});
