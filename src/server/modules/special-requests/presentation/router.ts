import {
  createTRPCRouter,
  getClientIp,
  protectedProcedure,
  rateLimit,
} from "elestampadero/server/api/trpc";
import { db } from "elestampadero/server/db";

import { createSpecialRequest } from "../application/use-cases/create-special-request";
import { createSpecialRequestInputSchema } from "./schemas";

const createSpecialRequestUseCase = createSpecialRequest({
  create: (input) =>
    db.specialRequest.create({
      data: {
        contactName: input.contactName,
        whatsapp: input.whatsapp,
        garmentType: input.garmentType,
        estimatedQty: input.estimatedQty,
        sizesAndColors: input.sizesAndColors,
        neededBy: input.neededBy,
        comments: input.comments,
        attachmentName: input.attachmentName,
      },
      select: { id: true, createdAt: true },
    }),
});

export const specialRequestsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSpecialRequestInputSchema)
    .use(
      rateLimit({
        limit: 10,
        windowMs: 10 * 60_000,
        key: ({ ctx }) => `special-request:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ input }) =>
      createSpecialRequestUseCase({
        contactName: input.contactName,
        whatsapp: input.whatsapp,
        garmentType: input.garmentType,
        estimatedQty: input.estimatedQty,
        sizesAndColors: input.sizesAndColors,
        neededBy: input.neededBy ?? null,
        comments: input.comments ?? null,
        attachmentName: null,
      }),
    ),
});
