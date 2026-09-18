"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Order, formatRupiah, ORDER_STATUS_LABEL } from "@/lib/helpers";

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-mist/60">Memuat...</p>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", code.trim().toUpperCase())
      .order("created_at", { ascending: true });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    if (searchParams.get("code")) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold text-mist">
        Cek Status Transaksi
      </h1>
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          className="input-field"
          placeholder="Masukkan kode pesanan, contoh: TD-20260918-AB12C"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn-primary shrink-0" disabled={loading}>
          {loading ? "Mencari..." : "Cek"}
        </button>
      </form>

      {searched && !loading && orders?.length === 0 && (
        <p className="text-mist/60">Kode pesanan tidak ditemukan.</p>
      )}

      {orders && orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-mist">
                  {o.product_name_snapshot} x{o.qty}
                </p>
                <span className="badge bg-brand/20 text-brand-light">
                  {ORDER_STATUS_LABEL[o.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-mist/60">
                Total: {formatRupiah(o.total)}
              </p>
              {o.note && (
                <p className="mt-1 text-sm text-mist/50">Catatan: {o.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
