"use client";

import { useState } from "react";

import { getSizeChart } from "../model/size-charts";

interface SizeChartProps {
  categorySlug: string | undefined;
}

export function SizeChart({ categorySlug }: SizeChartProps) {
  const [open, setOpen] = useState(false);
  const chart = getSizeChart(categorySlug);

  if (!chart) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-deep text-sm font-semibold hover:underline"
      >
        {open ? "Ocultar tabla de medidas" : "Ver tabla de medidas"}
      </button>

      {open ? (
        <div className="mt-3 overflow-x-auto rounded-md border border-black/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper">
              <tr>
                <th className="text-muted px-3 py-2 font-mono text-xs uppercase">
                  Talle
                </th>
                {chart.columns.map((column) => (
                  <th
                    key={column}
                    className="text-muted px-3 py-2 font-mono text-xs uppercase"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row) => (
                <tr key={row.size} className="border-t border-black/5">
                  <td className="text-ink px-3 py-2 font-semibold">
                    {row.size}
                  </td>
                  {chart.columns.map((column) => (
                    <td key={column} className="text-muted px-3 py-2">
                      {row.measurements[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted border-t border-black/5 px-3 py-2 text-xs">
            Medidas de referencia por línea de producto; pueden variar unos
            centímetros según la tela.
          </p>
        </div>
      ) : null}
    </div>
  );
}
