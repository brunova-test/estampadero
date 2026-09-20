import { TRPCError } from "@trpc/server";

import {
  adminMutationRateLimit,
  adminProcedure,
  createTRPCRouter,
  getClientIp,
  publicProcedure,
  rateLimit,
} from "elestampadero/server/api/trpc";
import { getOrderByIdUseCase } from "elestampadero/server/modules/orders";

import { createCheckoutSession } from "../application/use-cases/create-checkout-session";
import { payWithCard } from "../application/use-cases/pay-with-card";
import { queryPaymentStatus } from "../application/use-cases/query-payment-status";
import { refundPayment } from "../application/use-cases/refund-payment";
import { setRefundReference } from "../application/use-cases/set-refund-reference";
import { voidRefund } from "../application/use-cases/void-refund";
import { runOrderPaidEffects } from "../infrastructure/order-paid-effects";
import { buildMobbexSplit } from "../infrastructure/mobbex-split";
import { mobbexGateway } from "../infrastructure/providers/mobbex-gateway";
import { modoGateway } from "../infrastructure/providers/modo-gateway";
import {
  paywayGateway,
  paywayTokenizeCard,
} from "../infrastructure/providers/payway-gateway";
import { prismaPaymentsRepository } from "../infrastructure/persistence/prisma-payments-repository";
import {
  createCheckoutSessionInputSchema,
  payWithCardInputSchema,
  queryPaymentStatusInputSchema,
  refundPaymentInputSchema,
  setRefundReferenceInputSchema,
  tokenizeCardInputSchema,
  voidRefundInputSchema,
} from "./schemas";

const createCheckoutSessionUseCase = createCheckoutSession({
  gateway: mobbexGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  channel: "MOBBEX_CHECKOUT",
  provider: "MOBBEX",
  processor: "MOBBEX",
  buildSplit: buildMobbexSplit,
});

const payWithCardUseCase = payWithCard({
  gateway: paywayGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  provider: "PAYWAY",
  processor: "PAYWAY",
});

const refundMobbexPaymentUseCase = refundPayment({
  gateway: mobbexGateway,
  repository: prismaPaymentsRepository,
  provider: "MOBBEX",
});
const refundPaywayPaymentUseCase = refundPayment({
  gateway: paywayGateway,
  repository: prismaPaymentsRepository,
  provider: "PAYWAY",
});




const voidRefundUseCase = voidRefund({
  gateway: paywayGateway,
  repository: prismaPaymentsRepository,
  provider: "PAYWAY",
});

const setRefundReferenceUseCase = setRefundReference({
  repository: prismaPaymentsRepository,
  provider: "PAYWAY",
});



const queryPaywayPaymentStatusUseCase = queryPaymentStatus({
  gateway: paywayGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  provider: "PAYWAY",
});
const queryMobbexPaymentStatusUseCase = queryPaymentStatus({
  gateway: mobbexGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  onOrderPaid: runOrderPaidEffects,
  provider: "MOBBEX",
});

const createModoSessionUseCase = createCheckoutSession({
  gateway: modoGateway,
  repository: prismaPaymentsRepository,
  getOrderById: getOrderByIdUseCase,
  channel: "MODO",
  provider: "MODO",
  processor: "PAYWAY",
});

function rejectDirectPayment<T>(
  _legacyOperation: () => Promise<T>,
): Promise<T> {
  return Promise.reject(
    new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Las compras nuevas se procesan desde el checkout unificado de Mobbex.",
    }),
  );
}

export const paymentsRouter = createTRPCRouter({



  tokenizeCard: publicProcedure
    .input(tokenizeCardInputSchema)
    .use(
      rateLimit<{ cardNumber: string }>({
        limit: 10,
        windowMs: 10 * 60_000,
        key: ({ ctx }) => `pay-tokenize:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ input }) =>
      rejectDirectPayment(() => paywayTokenizeCard(input)),
    ),

  createCheckoutSession: publicProcedure
    .input(createCheckoutSessionInputSchema)
    .use(
      rateLimit<{ orderId: string }>({
        limit: 5,
        windowMs: 10 * 60_000,
        key: ({ ctx, input }) =>
          `pay-session:${input.orderId}:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ input }) =>
      createCheckoutSessionUseCase(input.orderId, input.paymentAttemptId),
    ),

  payWithCard: publicProcedure
    .input(payWithCardInputSchema)
    .use(
      rateLimit<{ orderId: string }>({
        limit: 5,
        windowMs: 10 * 60_000,
        key: ({ ctx, input }) =>
          `pay-card:${input.orderId}:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ input }) =>
      rejectDirectPayment(() =>
        payWithCardUseCase({
          orderId: input.orderId,
          paymentAttemptId: input.paymentAttemptId,
          cardToken: input.cardToken,
          bin: input.bin ?? "",
          paymentMethodId: input.paymentMethodId,
          issuerId: input.issuerId ?? null,
          installments: input.installments,
          payerDocType: input.payerDocType ?? null,
          payerDocNumber: input.payerDocNumber ?? null,
        }),
      ),
    ),

  refundPayment: adminProcedure
    .input(refundPaymentInputSchema)
    .use(adminMutationRateLimit("payments.refundPayment"))
    .mutation(async ({ input }) => {
      const payment = await prismaPaymentsRepository.findById(input.paymentId);
      return payment?.provider === "MOBBEX"
        ? refundMobbexPaymentUseCase(input)
        : refundPaywayPaymentUseCase(input);
    }),

  voidRefund: adminProcedure
    .input(voidRefundInputSchema)
    .use(adminMutationRateLimit("payments.voidRefund"))
    .mutation(({ input }) => voidRefundUseCase(input)),

  setRefundReference: adminProcedure
    .input(setRefundReferenceInputSchema)
    .use(adminMutationRateLimit("payments.setRefundReference"))
    .mutation(({ input }) => setRefundReferenceUseCase(input)),

  queryPaymentStatus: adminProcedure
    .input(queryPaymentStatusInputSchema)
    .use(adminMutationRateLimit("payments.queryPaymentStatus"))
    .mutation(async ({ input }) => {
      const payment = await prismaPaymentsRepository.findById(input.paymentId);
      return payment?.provider === "MOBBEX"
        ? queryMobbexPaymentStatusUseCase(input)
        : queryPaywayPaymentStatusUseCase(input);
    }),

  createModoSession: publicProcedure
    .input(createCheckoutSessionInputSchema)
    .use(
      rateLimit<{ orderId: string }>({
        limit: 5,
        windowMs: 10 * 60_000,
        key: ({ ctx, input }) =>
          `pay-modo-session:${input.orderId}:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ input }) =>
      rejectDirectPayment(() =>
        createModoSessionUseCase(input.orderId, input.paymentAttemptId),
      ),
    ),
});
