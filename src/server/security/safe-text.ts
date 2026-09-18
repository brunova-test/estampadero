import { z } from "zod";

const EXECUTABLE_CONTENT_PATTERNS = [
  /<\s*\/?\s*[a-z][^>]*>/i,
  /(?:javascript|vbscript|data)\s*:/i,
  /\bon[a-z]+\s*=/i,
  /<\?(?:php|=)?|<%|#!\s*\/\S+/i,
  /\b(?:eval|Function|setTimeout|setInterval)\s*\(/,
  /\b(?:function|class|const|let|var)\s+[A-Za-z_$][\w$]*/,
  /(?:^|\n)\s*(?:import|export)\s+(?:[\w*{]|default\b)/m,
  /(?:=>|console\.[a-z]+\s*\()/i,
  /\b(?:SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|DROP\s+(?:TABLE|DATABASE))\b/i,
];

export const SAFE_TEXT_ERROR =
  "No se permite ingresar scripts, etiquetas HTML ni código de programación.";

export function containsExecutableContent(value: string) {
  return EXECUTABLE_CONTENT_PATTERNS.some((pattern) => pattern.test(value));
}

type SafeTextOptions = {
  min?: number;
  max: number;
  minMessage?: string;
  maxMessage?: string;
};

export function safeTextSchema({
  min,
  max,
  minMessage,
  maxMessage,
}: SafeTextOptions) {
  let schema = z.string().trim();

  if (min !== undefined) schema = schema.min(min, minMessage);
  schema = schema.max(max, maxMessage);

  return schema.refine((value) => !containsExecutableContent(value), {
    message: SAFE_TEXT_ERROR,
  });
}
