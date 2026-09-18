"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Withdrawal, formatRupiah, WITHDRAWAL_STATUS_LABEL } from "@/lib/helpers";

const STATUS_OPTIONS: Withdrawal["status"][] = [
  "pending",
  "diproses",
  "selesai",
  "ditolak",
];

export default function AdminPencairanPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("semua");

  async function loadWithdrawals() {
    setLoading(true);
    let query = supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter !== "semua") query = query.eq("status", filter);
    const { data } = await query;
    const list = (data as Withdrawal[]) || [];
    setWithdrawals(list);

    const sellerIds = Array.from(new Set(list.map((w) => w.seller_id)));
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", sellerIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: { id: string; full_name: string | null }) => {
        map[p.id] = p.full_name || "(tanpa nama)";
      });
      setSellerNames(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: Withdrawal["status"]) {
    await supabase.from("withdrawals").update({ status }).eq("id", id);
    loadWithdrawals();
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-mist">
        Pencairan Saldo Merchant
      </h1>
      <p className="mb-6 text-sm text-mist/60">
        Proses transfer manual ke rekening merchant, lalu ubah status menjadi
        &quot;Selesai&quot; — saldo merchant akan otomatis terpotong.
      </p>

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
            {s === "semua"
              ? "Semua"
              : WITHDRAWAL_STATUS_LABEL[s as Withdrawal["status"]]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-mist/60">Memuat...</p>
      ) : withdrawals.length === 0 ? (
        <p className="text-mist/60">Belum ada permintaan pencairan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-mist">
                    {sellerNames[w.seller_id] || w.seller_id}
                  </p>
                  <p className="text-sm font-semibold text-amber">
                    {formatRupiah(w.amount)}
                  </p>
                  <p className="text-sm text-mist/60">
                    {w.bank_name} · {w.bank_account_number} ·{" "}
                    {w.bank_account_holder}
                  </p>
                  <p className="text-xs text-mist/40">
                    Diajukan {new Date(w.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <select
                  value={w.status}
                  onChange={(e) =>
                    updateStatus(w.id, e.target.value as Withdrawal["status"])
                  }
                  className="input-field w-auto"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {WITHDRAWAL_STATUS_LABEL[s]}
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
