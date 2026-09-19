"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/lib/helpers";
import ProductCard from "@/components/ProductCard";
import { useSearchParams } from "next/navigation";

const CATEGORIES = ["semua", "akun", "jasa", "voucher", "lainnya"];

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-mist/60">Memuat...</p>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("semua");

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (q) query = query.ilike("name", `%${q}%`);
      if (category !== "semua") query = query.eq("category", category);

      const { data, error } = await query;
      if (!error && data) setProducts(data as Product[]);
      setLoading(false);
    }
    load();
  }, [q, category]);

  return (
    <div className="flex flex-col gap-10">
      <section className="card flex flex-col gap-4 overflow-hidden p-8 sm:p-12">
        <span className="badge w-fit bg-brand/20 text-brand-light">
          Marketplace Produk Digital
        </span>
        <h1 className="max-w-xl font-display text-3xl font-bold leading-tight text-mist sm:text-4xl">
          Belanja akun, jasa, dan voucher digital — proses cepat, aman, terpercaya.
        </h1>
        <p className="max-w-lg text-mist/70">
          Bayar via transfer manual, unggah bukti, dan pesanan kami verifikasi
          secepatnya. Bisa cek status transaksi kapan saja tanpa perlu akun.
        </p>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm capitalize transition ${
                category === c
                  ? "border-brand bg-brand/20 text-brand-light"
                  : "border-line text-mist/70 hover:border-brand"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-mist/60">Memuat produk...</p>
        ) : products.length === 0 ? (
          <p className="text-mist/60">
            Belum ada produk untuk kategori/pencarian ini.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
