"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { StoreApplication } from "@/lib/helpers";

export default function DaftarTokoPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [existingApp, setExistingApp] = useState<StoreApplication | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: app } = await supabase
          .from("store_applications")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .maybeSingle();
        setExistingApp(app as StoreApplication | null);
      }
      setChecking(false);
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("store_applications").insert({
      user_id: userId,
      store_name: storeName,
      description,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    window.location.reload();
  }

  if (checking) return <p className="text-mist/60">Memuat...</p>;

  if (!userId) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-xl font-bold text-mist">Buka Toko</h1>
        <p className="mt-3 text-mist/70">
          Anda perlu masuk atau daftar akun terlebih dahulu untuk mengajukan
          pembukaan toko.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Masuk / Daftar
        </Link>
      </div>
    );
  }

  if (existingApp) {
    const statusText =
      existingApp.status === "pending"
        ? "Sedang ditinjau oleh admin."
        : existingApp.status === "approved"
        ? "Selamat! Pengajuan toko Anda disetujui."
        : "Pengajuan toko Anda ditolak.";
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-xl font-bold text-mist">
          {existingApp.store_name}
        </h1>
        <p className="mt-3 text-mist/70">{statusText}</p>
        {existingApp.admin_note && (
          <p className="mt-2 text-sm text-mist/50">
            Catatan admin: {existingApp.admin_note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="mb-1 text-center font-display text-2xl font-bold text-mist">
          Ajukan Buka Toko
        </h1>
        <p className="mb-6 text-center text-sm text-mist/60">
          Pengajuan akan ditinjau oleh admin sebelum toko Anda aktif.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-mist/70">Nama Toko</label>
            <input
              required
              className="input-field"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mist/70">
              Deskripsi Singkat
            </label>
            <textarea
              required
              rows={4}
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </form>
      </div>
    </div>
  );
}
