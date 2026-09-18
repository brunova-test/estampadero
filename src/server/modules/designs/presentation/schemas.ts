import { z } from "zod";

import { safeTextSchema } from "elestampadero/server/security/safe-text";

const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      value.startsWith("https://"),
    { message: "Debe ser una ruta relativa (/imagen.png) o una URL https." },
  );

export const listDesignsByClubInputSchema = z.object({
  clubId: z.string().min(1).max(60),
});

export const createDesignInputSchema = z
  .object({
    clubId: z.string().min(1).max(60).optional(),
    customerName: safeTextSchema({ min: 2, max: 120 }).optional(),
    title: safeTextSchema({ min: 3, max: 160 }),
    imageUrl: imageUrlSchema,
    imageUrls: z.array(imageUrlSchema).max(12).optional(),
  })
  .refine((input) => Boolean(input.clubId) !== Boolean(input.customerName), {
    message: "ElegÃ­ un club o indicÃ¡ el nombre del cliente personalizado.",
    path: ["clubId"],
  });

export const addDesignVersionInputSchema = z.object({
  designId: z.string().min(1).max(60),
  title: safeTextSchema({ min: 3, max: 160 }),
  description: safeTextSchema({ min: 3, max: 500 }),
  imageUrl: imageUrlSchema,
});

export const updateDesignVersionInputSchema = z.object({
  designId: z.string().min(1).max(60),
  versionId: z.string().min(1).max(60),
  imageUrl: imageUrlSchema,
  changeNote: safeTextSchema({ min: 3, max: 500 }),
});

export const requestDesignChangesInputSchema = z.object({
  designId: z.string().min(1).max(60),
  versionId: z.string().min(1).max(60),
  message: safeTextSchema({ min: 3, max: 500 }),
});

export const addDesignCommentInputSchema = z.object({
  designId: z.string().min(1).max(60),
  versionId: z.string().min(1).max(60).optional(),
  message: safeTextSchema({ min: 1, max: 500 }),
});

export const linkProductInputSchema = z.object({
  designId: z.string().min(1).max(60),
  productId: z.string().min(1).max(60),
});
