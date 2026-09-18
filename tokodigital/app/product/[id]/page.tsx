"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Product, formatRupiah } from "@/lib/helpers";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("slug", params.id)
        .eq("status", "active")
        .maybeSingle();
      setProduct(data as Product | null);
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <p className="text-mist/60">Memuat produk...</p>;
  if (!product)
    return (
      <div className="card p-8 text-center text-mist/70">
        Produk tidak ditemukan.
      </div>
    );

  function handleAddToCart() {
    if (!product) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (!product) return;
    addItem(product, qty);
    router.push("/checkout");
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="card flex aspect-square items-center justify-center bg-surface2">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <span className="font-display text-6xl text-mist/30">
            {product.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <span className="badge w-fit bg-surface2 text-mist/70">
          {product.category}
        </span>
        <h1 className="font-display text-2xl font-bold text-mist">
          {product.name}
        </h1>
        <p className="font-display text-2xl font-bold text-amber">
          {formatRupiah(product.price)}
        </p>
        <p className="whitespace-pre-line text-mist/70">
          {product.description || "Tidak ada deskripsi."}
        </p>
        <p className="text-sm text-mist/50">Stok tersedia: {product.stock}</p>

        <div className="flex items-center gap-3">
          <label className="text-sm text-mist/70">Jumlah</label>
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="input-field w-24"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleAddToCart} className="btn-outline flex-1">
            {added ? "Ditambahkan ✓" : "Tambah ke Keranjang"}
          </button>
          <button onClick={handleBuyNow} className="btn-primary flex-1">
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
