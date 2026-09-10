import { describe, expect, it } from "vitest";

import { changePasswordInputSchema } from "./schemas";

describe("changePasswordInputSchema", () => {
  it("accepts a valid password change", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "Clave-inicial-1",
      newPassword: "Clave-nueva-2",
      confirmPassword: "Clave-nueva-2",
    });

    expect(result.success).toBe(true);
  });

  it("rejects passwords shorter than eight characters", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "Clave-inicial-1",
      newPassword: "corta",
      confirmPassword: "corta",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a confirmation that does not match", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "Clave-inicial-1",
      newPassword: "Clave-nueva-2",
      confirmPassword: "Otra-clave-3",
    });

    expect(result.success).toBe(false);
  });

  it("rejects reusing the current password", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "Clave-inicial-1",
      newPassword: "Clave-inicial-1",
      confirmPassword: "Clave-inicial-1",
    });

    expect(result.success).toBe(false);
  });
});
