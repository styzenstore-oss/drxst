"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Order,
  BalanceClaim,
  formatRupiah,
  ORDER_STATUS_LABEL,
  CLAIM_STATUS_LABEL,
} from "@/lib/helpers";

export default function TokoSayaPesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Record<string, BalanceClaim>>({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    const [{ data: orderData }, { data: claimData }] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("seller_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("balance_claims")
        .select("*")
        .eq("seller_id", uid)
        .in("status", ["pending", "approved"]),
    ]);

    setOrders((orderData as Order[]) || []);
    const map: Record<string, BalanceClaim> = {};
    (claimData as BalanceClaim[] | null)?.forEach((c) => {
      map[c.order_id] = c;
    });
    setClaims(map);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleClaim(order: Order) {
    setError(null);
    setClaiming(order.id);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setClaiming(null);
      return;
    }
    const { error } = await supabase.from("balance_claims").insert({
      order_id: order.id,
      seller_id: uid,
      amount: order.total,
    });
    setClaiming(null);
    if (error) {
      setError(error.message);
      return;
    }
    loadData();
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-mist">Pesanan Saya</h1>
      <p className="mb-6 text-sm text-mist/60">
        Daftar pesanan dari produk toko Anda. Setelah pembayaran pembeli
        diverifikasi admin (status &quot;Diproses&quot;), kirim/proses pesanan lalu
        klik &quot;Tandai Selesai&quot;. Admin akan mengecek dan menyetujuinya —
        begitu disetujui, pesanan otomatis berstatus Selesai dan saldo Anda
        otomatis bertambah.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-mist/60">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <p className="text-mist/60">Belum ada pesanan untuk produk Anda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const claim = claims[o.id];
            return (
              <div key={o.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-mist/50">{o.order_code}</p>
                    <p className="font-semibold text-mist">
                      {o.product_name_snapshot} x{o.qty}
                    </p>
                    <p className="text-sm text-mist/60">
                      {o.customer_name} · {o.customer_contact}
                    </p>
                    <p className="text-sm font-semibold text-amber">
                      {formatRupiah(o.total)}
                    </p>
                    <span className="badge mt-2 bg-brand/20 text-brand-light">
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {o.status !== "diproses" && o.status !== "selesai" && !claim && (
                      <p className="max-w-[200px] text-right text-xs text-mist/40">
                        Menunggu admin memverifikasi pembayaran pembeli
                      </p>
                    )}
                    {o.status === "diproses" && !claim && (
                      <button
                        onClick={() => handleClaim(o)}
                        disabled={claiming === o.id}
                        className="btn-primary !py-1.5 !px-3 text-sm"
                      >
                        {claiming === o.id ? "Mengajukan..." : "Tandai Selesai"}
                      </button>
                    )}
                    {claim && (
                      <span
                        className={`badge ${
                          claim.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : claim.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber/20 text-amber"
                        }`}
                      >
                        {claim.status === "approved"
                          ? "Disetujui, Saldo Masuk"
                          : claim.status === "rejected"
                          ? CLAIM_STATUS_LABEL[claim.status]
                          : "Menunggu Persetujuan Admin"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
