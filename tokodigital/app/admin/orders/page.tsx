"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Order, formatRupiah, ORDER_STATUS_LABEL } from "@/lib/helpers";

const STATUS_OPTIONS: Order["status"][] = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "diproses",
  "selesai",
  "dibatalkan",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("semua");

  async function loadOrders() {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filter !== "semua") query = query.eq("status", filter);
    const { data } = await query;
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: Order["status"]) {
    await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    loadOrders();
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-mist">Kelola Pesanan</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {["semua", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === s
                ? "border-brand bg-brand/20 text-brand-light"
                : "border-line text-mist/60"
            }`}
          >
            {s === "semua" ? "Semua" : ORDER_STATUS_LABEL[s as Order["status"]]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-mist/60">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <p className="text-mist/60">Belum ada pesanan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
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
                  {o.note && <p className="text-sm text-mist/50">Catatan: {o.note}</p>}
                  {o.payment_proof_url && (
                    <a
                      href={o.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-brand-light hover:underline"
                    >
                      Lihat Bukti Transfer
                    </a>
                  )}
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value as Order["status"])}
                  className="input-field w-auto"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
