import { describe, expect, it } from "vitest";

import { containsExecutableContent, safeTextSchema } from "./safe-text";

describe("safe text validation", () => {
  it.each([
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    "javascript:alert(1)",
    "const payload = () => true",
    "SELECT password FROM users",
    "#!/bin/sh\necho hacked",
  ])("rejects executable content: %s", (value) => {
    expect(containsExecutableContent(value)).toBe(true);
    expect(safeTextSchema({ max: 200 }).safeParse(value).success).toBe(false);
  });

  it.each([
    "Remeras para el equipo de primera",
    "Estampado al frente, en blanco y violeta",
    "Av. San Martín 1234, piso 2",
  ])("accepts ordinary customer text: %s", (value) => {
    expect(safeTextSchema({ max: 200 }).safeParse(value).success).toBe(true);
  });
});
