"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/helpers";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    pendingStores: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function load() {
      const [{ count: productCount }, { data: pendingOrders }, { count: pendingStores }, { data: doneOrders }] =
        await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("id").eq("status", "menunggu_verifikasi"),
          supabase
            .from("store_applications")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase.from("orders").select("total").eq("status", "selesai"),
        ]);

      const revenue = (doneOrders || []).reduce(
        (sum: number, o: { total: number }) => sum + Number(o.total),
        0
      );

      setStats({
        totalProducts: productCount || 0,
        pendingOrders: pendingOrders?.length || 0,
        pendingStores: pendingStores || 0,
        revenue,
      });
    }
    load();
  }, []);

  const cards = [
    { label: "Total Produk", value: stats.totalProducts },
    { label: "Pesanan Menunggu Verifikasi", value: stats.pendingOrders },
    { label: "Pengajuan Toko Menunggu", value: stats.pendingStores },
    { label: "Pendapatan (Selesai)", value: formatRupiah(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-mist">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-mist/60">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-mist">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
