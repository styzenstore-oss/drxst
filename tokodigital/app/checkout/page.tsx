"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah, generateOrderCode } from "@/lib/helpers";

type Settings = Record<string, string>;

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({});
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const map: Settings = {};
        data.forEach((row: { key: string; value: string }) => {
          map[row.key] = row.value;
        });
        setSettings(map);
      }
    }
    loadSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const code = generateOrderCode();
      let proofUrl: string | null = null;

      if (proofFile) {
        const path = `${code}-${proofFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(path, proofFile);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage
          .from("payment-proofs")
          .getPublicUrl(path);
        proofUrl = publicUrl.publicUrl;
      }

      const { data: userData } = await supabase.auth.getUser();

      const rows = items.map((item) => ({
        order_code: code,
        customer_id: userData.user?.id ?? null,
        customer_name: name,
        customer_contact: contact,
        product_id: item.product.id,
        product_name_snapshot: item.product.name,
        qty: item.qty,
        total: item.product.price * item.qty,
        status: proofUrl ? "menunggu_verifikasi" : "menunggu_pembayaran",
        payment_proof_url: proofUrl,
        note,
      }));

      const { error: insertError } = await supabase.from("orders").insert(rows);
      if (insertError) throw insertError;

      clearCart();
      setOrderCode(code);
    } catch (err: any) {
      setError(err.message || "Gagal membuat pesanan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderCode) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-mist">
          Pesanan Berhasil Dibuat 🎉
        </h1>
        <p className="mt-3 text-mist/70">Kode pesanan Anda:</p>
        <p className="mt-1 font-display text-xl font-bold text-amber">{orderCode}</p>
        <p className="mt-4 text-sm text-mist/60">
          Simpan kode ini untuk mengecek status pesanan di halaman{" "}
          <span className="text-brand-light">Cek Transaksi</span>.
        </p>
        <button
          onClick={() => router.push(`/orders?code=${orderCode}`)}
          className="btn-primary mt-6"
        >
          Lihat Status Pesanan
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center text-mist/70">
        Keranjang kosong, tidak ada yang bisa di-checkout.
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6 lg:col-span-2">
        <h1 className="font-display text-xl font-bold text-mist">Data Pemesan</h1>

        <div>
          <label className="mb-1 block text-sm text-mist/70">Nama Lengkap</label>
          <input
            required
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-mist/70">No. WhatsApp / Email</label>
          <input
            required
            className="input-field"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-mist/70">Catatan (opsional)</label>
          <textarea
            className="input-field"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-line bg-surface2 p-4 text-sm text-mist/80">
          <p className="mb-2 font-semibold text-mist">Transfer ke rekening berikut:</p>
          <p>Bank: {settings.bank_name || "-"}</p>
          <p>No. Rekening: {settings.bank_account_number || "-"}</p>
          <p>Atas Nama: {settings.bank_account_holder || "-"}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-mist/70">
            Unggah Bukti Transfer (opsional saat ini, bisa disusulkan)
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="input-field"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary mt-2">
          {submitting ? "Memproses..." : "Buat Pesanan"}
        </button>
      </form>

      <div className="card h-fit p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-mist">Ringkasan</h2>
        <ul className="mb-4 flex flex-col gap-2 text-sm text-mist/70">
          {items.map((i) => (
            <li key={i.product.id} className="flex justify-between">
              <span>
                {i.product.name} x{i.qty}
              </span>
              <span>{formatRupiah(i.product.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-line pt-3 font-bold text-mist">
          <span>Total</span>
          <span className="text-amber">{formatRupiah(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
