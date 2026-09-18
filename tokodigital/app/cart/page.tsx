"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/helpers";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-mist/70">Keranjang Anda masih kosong.</p>
        <Link href="/" className="btn-primary">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {items.map(({ product, qty }) => (
          <div key={product.id} className="card flex items-center gap-4 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface2 font-display text-xl text-mist/40">
              {product.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-mist">{product.name}</p>
              <p className="text-sm text-amber">{formatRupiah(product.price)}</p>
            </div>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) =>
                updateQty(product.id, Math.max(1, Number(e.target.value)))
              }
              className="input-field w-20"
            />
            <button
              onClick={() => removeItem(product.id)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      <div className="card h-fit p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-mist">
          Ringkasan Belanja
        </h2>
        <div className="flex justify-between text-mist/70">
          <span>Total</span>
          <span className="font-bold text-amber">{formatRupiah(totalPrice)}</span>
        </div>
        <Link href="/checkout" className="btn-primary mt-6 block text-center">
          Lanjut ke Checkout
        </Link>
      </div>
    </div>
  );
}
