"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BalanceClaim, formatRupiah, CLAIM_STATUS_LABEL } from "@/lib/helpers";

export default function AdminKlaimSaldoPage() {
  const [claims, setClaims] = useState<BalanceClaim[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "semua">(
    "pending"
  );
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadClaims() {
    setLoading(true);
    let query = supabase
      .from("balance_claims")
      .select("*, orders(order_code, product_name_snapshot, customer_name)")
      .order("created_at", { ascending: false });
    if (filter !== "semua") query = query.eq("status", filter);
    const { data } = await query;
    const list = (data as BalanceClaim[]) || [];
    setClaims(list);

    const sellerIds = Array.from(new Set(list.map((c) => c.seller_id)));
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
    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleDecision(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    await supabase
      .from("balance_claims")
      .update({
        status,
        admin_note: noteDraft[id] || null,
      })
      .eq("id", id);
    setBusyId(null);
    loadClaims();
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-mist">
        Klaim Saldo Merchant
      </h1>
      <p className="mb-6 text-sm text-mist/60">
        Setujui klaim untuk menambahkan saldo ke dompet merchant secara otomatis.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "semua"] as const).map((s) => (
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
              : CLAIM_STATUS_LABEL[s as "pending" | "approved" | "rejected"]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-mist/60">Memuat...</p>
      ) : claims.length === 0 ? (
        <p className="text-mist/60">Tidak ada klaim saldo.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-mono text-xs text-mist/50">
                    {c.orders?.order_code}
                  </p>
                  <p className="font-semibold text-mist">
                    {c.orders?.product_name_snapshot}
                  </p>
                  <p className="text-sm text-mist/60">
                    Merchant: {sellerNames[c.seller_id] || c.seller_id}
                  </p>
                  <p className="text-sm text-mist/60">
                    Pembeli: {c.orders?.customer_name}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-amber">
                    {formatRupiah(c.amount)}
                  </p>
                  <span
                    className={`badge mt-2 ${
                      c.status === "pending"
                        ? "bg-amber/20 text-amber"
                        : c.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {CLAIM_STATUS_LABEL[c.status]}
                  </span>
                </div>

                {c.status === "pending" && (
                  <div className="flex w-full flex-col gap-2 sm:w-64">
                    <input
                      placeholder="Catatan (opsional)"
                      className="input-field"
                      value={noteDraft[c.id] || ""}
                      onChange={(e) =>
                        setNoteDraft({ ...noteDraft, [c.id]: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(c.id, "approved")}
                        disabled={busyId === c.id}
                        className="btn-primary flex-1 !py-1.5 text-sm"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleDecision(c.id, "rejected")}
                        disabled={busyId === c.id}
                        className="btn-outline flex-1 !py-1.5 text-sm"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
