import { z } from "zod";

import { safeTextSchema } from "elestampadero/server/security/safe-text";

export const registerInputSchema = z.object({
  name: safeTextSchema({ min: 2, max: 120 }),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(72),
});

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .superRefine((input, ctx) => {
    if (input.newPassword !== input.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas nuevas no coinciden.",
      });
    }

    if (input.currentPassword === input.newPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "La nueva contraseña debe ser diferente a la actual.",
      });
    }
  });
