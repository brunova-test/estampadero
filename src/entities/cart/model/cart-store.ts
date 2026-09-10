"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  size: string;
  color: string;
  priceInCents: number;
  quantity: number;
  clubName: string | null;
}

interface PurchasedLine {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  settledOrderIds: string[];
  removePurchasedOrder: (orderId: string, lines: PurchasedLine[]) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line, quantity) =>
        set((state) => {
          const existing = state.lines.find(
            (item) => item.variantId === line.variantId,
          );
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                item.variantId === line.variantId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity }] };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((item) => item.variantId !== variantId)
              : state.lines.map((item) =>
                  item.variantId === variantId ? { ...item, quantity } : item,
                ),
        })),
      removeLine: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((item) => item.variantId !== variantId),
        })),
      settledOrderIds: [],
      removePurchasedOrder: (orderId, purchasedLines) =>
        set((state) => {
          if (state.settledOrderIds.includes(orderId)) return state;

          const lines = state.lines.flatMap((line) => {
            const purchased = purchasedLines.find(
              (item) =>
                item.productId === line.productId &&
                item.size === line.size &&
                item.color === line.color,
            );
            if (!purchased) return [line];

            const quantity = line.quantity - purchased.quantity;
            return quantity > 0 ? [{ ...line, quantity }] : [];
          });

          return {
            lines,
            settledOrderIds: [...state.settledOrderIds, orderId].slice(-100),
          };
        }),
      clear: () => set({ lines: [] }),
    }),
    { name: "elestampadero-cart" },
  ),
);

export function cartTotalQuantity(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce(
    (sum, line) => sum + line.priceInCents * line.quantity,
    0,
  );
}
