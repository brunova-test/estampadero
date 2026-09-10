interface SizeChartRow {
  size: string;
  measurements: Record<string, string>;
}

interface SizeChart {
  columns: string[];
  rows: SizeChartRow[];
}

const CHEST_LENGTH_CHART: SizeChart = {
  columns: ["Ancho de pecho (cm)", "Largo total (cm)"],
  rows: [
    { size: "S", measurements: { "Ancho de pecho (cm)": "48", "Largo total (cm)": "68" } },
    { size: "M", measurements: { "Ancho de pecho (cm)": "51", "Largo total (cm)": "70" } },
    { size: "L", measurements: { "Ancho de pecho (cm)": "54", "Largo total (cm)": "72" } },
    { size: "XL", measurements: { "Ancho de pecho (cm)": "57", "Largo total (cm)": "74" } },
  ],
};

const HOODIE_CHART: SizeChart = {
  columns: ["Ancho de pecho (cm)", "Largo total (cm)", "Largo de manga (cm)"],
  rows: [
    {
      size: "S",
      measurements: {
        "Ancho de pecho (cm)": "54",
        "Largo total (cm)": "66",
        "Largo de manga (cm)": "60",
      },
    },
    {
      size: "M",
      measurements: {
        "Ancho de pecho (cm)": "57",
        "Largo total (cm)": "68",
        "Largo de manga (cm)": "62",
      },
    },
    {
      size: "L",
      measurements: {
        "Ancho de pecho (cm)": "60",
        "Largo total (cm)": "70",
        "Largo de manga (cm)": "64",
      },
    },
    {
      size: "XL",
      measurements: {
        "Ancho de pecho (cm)": "63",
        "Largo total (cm)": "72",
        "Largo de manga (cm)": "66",
      },
    },
  ],
};

const SHORTS_CHART: SizeChart = {
  columns: ["Cintura (cm)", "Largo (cm)"],
  rows: [
    { size: "S", measurements: { "Cintura (cm)": "76", "Largo (cm)": "42" } },
    { size: "M", measurements: { "Cintura (cm)": "82", "Largo (cm)": "44" } },
    { size: "L", measurements: { "Cintura (cm)": "88", "Largo (cm)": "46" } },
  ],
};

const SIZE_CHARTS_BY_CATEGORY: Record<string, SizeChart> = {
  remeras: CHEST_LENGTH_CHART,
  camisetas: CHEST_LENGTH_CHART,
  buzos: HOODIE_CHART,
  shorts: SHORTS_CHART,
};

export function getSizeChart(categorySlug: string | undefined): SizeChart | null {
  if (!categorySlug) return null;
  return SIZE_CHARTS_BY_CATEGORY[categorySlug] ?? null;
}

export type { SizeChart };
