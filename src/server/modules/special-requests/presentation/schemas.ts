import { z } from "zod";

import { safeTextSchema } from "elestampadero/server/security/safe-text";

export const createSpecialRequestInputSchema = z
  .object({
    contactName: safeTextSchema({ min: 2, max: 120 }),
    whatsapp: safeTextSchema({ min: 6, max: 30 }),
    garmentType: safeTextSchema({ min: 2, max: 80 }),
    estimatedQty: safeTextSchema({ min: 1, max: 40 }),
    sizesAndColors: safeTextSchema({ min: 1, max: 200 }),
    neededBy: safeTextSchema({ max: 60 }).optional(),
    comments: safeTextSchema({ max: 600 }).optional(),
  })
  .strict();
