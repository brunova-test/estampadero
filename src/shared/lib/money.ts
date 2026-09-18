const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}
