"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  BalanceClaim,
  Withdrawal,
  formatRupiah,
  CLAIM_STATUS_LABEL,
  WITHDRAWAL_STATUS_LABEL,
} from "@/lib/helpers";

const EMPTY_FORM = {
  amount: "",
  bank_name: "",
  bank_account_number: "",
  bank_account_holder: "",
};

export default function DompetPage() {
  const [balance, setBalance] = useState(0);
  const [claims, setClaims] = useState<BalanceClaim[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    const [{ data: profile }, { data: claimData }, { data: withdrawalData }] =
      await Promise.all([
        supabase.from("profiles").select("balance").eq("id", uid).maybeSingle(),
        supabase
          .from("balance_claims")
          .select("*, orders(order_code, product_name_snapshot, customer_name)")
          .eq("seller_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawals")
          .select("*")
          .eq("seller_id", uid)
          .order("created_at", { ascending: false }),
      ]);

    setBalance(Number(profile?.balance || 0));
    setClaims((claimData as BalanceClaim[]) || []);
    setWithdrawals((withdrawalData as Withdrawal[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setError("Jumlah pencairan tidak valid.");
      return;
    }
    if (amount > balance) {
      setError("Jumlah pencairan melebihi saldo Anda.");
      return;
    }
    if (!form.bank_name || !form.bank_account_number || !form.bank_account_holder) {
      setError("Lengkapi data rekening tujuan pencairan.");
      return;
    }

    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("withdrawals").insert({
      seller_id: uid,
      amount,
      bank_name: form.bank_name,
      bank_account_number: form.bank_account_number,
      bank_account_holder: form.bank_account_holder,
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    loadData();
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-mist">Dompet Saya</h1>

      <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-mist/60">Saldo Tersedia</p>
          <p className="mt-1 font-display text-3xl font-bold text-amber">
            {formatRupiah(balance)}
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-primary"
          disabled={balance <= 0 && !showForm}
        >
          {showForm ? "Batal" : "Cairkan Saldo"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1 block text-sm text-mist/70">
              Jumlah Pencairan (Rp)
            </label>
            <input
              required
              type="number"
              max={balance}
              className="input-field"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <p className="mt-1 text-xs text-mist/40">
              Maksimal {formatRupiah(balance)}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-mist/70">Nama Bank</label>
            <input
              required
              className="input-field"
              placeholder="contoh: BCA"
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mist/70">Nomor Rekening</label>
            <input
              required
              className="input-field"
              value={form.bank_account_number}
              onChange={(e) =>
                setForm({ ...form, bank_account_number: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mist/70">
              Nama Pemilik Rekening
            </label>
            <input
              required
              className="input-field"
              value={form.bank_account_holder}
              onChange={(e) =>
                setForm({ ...form, bank_account_holder: e.target.value })
              }
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Mengirim..." : "Ajukan Pencairan"}
          </button>
        </form>
      )}

      <h2 className="mb-3 font-display text-lg font-semibold text-mist">
        Riwayat Pencairan
      </h2>
      {loading ? (
        <p className="text-mist/60">Memuat...</p>
      ) : withdrawals.length === 0 ? (
        <p className="mb-8 text-sm text-mist/50">Belum ada riwayat pencairan.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-mist">{formatRupiah(w.amount)}</p>
                  <p className="text-sm text-mist/60">
                    {w.bank_name} · {w.bank_account_number} · {w.bank_account_holder}
                  </p>
                  <p className="text-xs text-mist/40">
                    Diajukan {new Date(w.created_at).toLocaleString("id-ID")}
                  </p>
                  {w.admin_note && (
                    <p className="mt-1 text-sm text-mist/50">
                      Catatan admin: {w.admin_note}
                    </p>
                  )}
                </div>
                <span
                  className={`badge ${
                    w.status === "selesai"
                      ? "bg-green-500/20 text-green-400"
                      : w.status === "ditolak"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber/20 text-amber"
                  }`}
                >
                  {WITHDRAWAL_STATUS_LABEL[w.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-display text-lg font-semibold text-mist">
        Riwayat Pesanan Selesai &amp; Saldo
      </h2>
      {loading ? (
        <p className="text-mist/60">Memuat...</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-mist/50">Belum ada klaim saldo.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-mist/50">
                    {c.orders?.order_code}
                  </p>
                  <p className="font-semibold text-mist">
                    {c.orders?.product_name_snapshot}
                  </p>
                  <p className="text-sm font-semibold text-amber">
                    {formatRupiah(c.amount)}
                  </p>
                  {c.admin_note && (
                    <p className="mt-1 text-sm text-mist/50">
                      Catatan admin: {c.admin_note}
                    </p>
                  )}
                </div>
                <span
                  className={`badge ${
                    c.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : c.status === "rejected"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber/20 text-amber"
                  }`}
                >
                  {CLAIM_STATUS_LABEL[c.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
