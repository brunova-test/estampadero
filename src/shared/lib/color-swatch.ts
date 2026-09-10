const COLOR_HEX: Record<string, string> = {
  negro: "#0e0a1a",
  blanco: "#ffffff",
  gris: "#8a839f",
  azul: "#4361ee",
  "azul marino": "#1c2a4a",
  violeta: "#2e0470",
  verde: "#3f6d3a",
  rojo: "#b8271f",
  naranja: "#b8571f",
  amarillo: "#e8c547",
  beige: "#d8c9a8",
  bordo: "#5c1a2e",
};

export function colorToHex(color: string): string {
  const normalized = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
  return COLOR_HEX[normalized] ?? "#c9c4d6";
}
