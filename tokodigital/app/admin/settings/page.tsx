"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const FIELDS: { key: string; label: string }[] = [
  { key: "site_name", label: "Nama Toko" },
  { key: "bank_name", label: "Nama Bank" },
  { key: "bank_account_number", label: "Nomor Rekening" },
  { key: "bank_account_holder", label: "Atas Nama Rekening" },
  { key: "whatsapp_cs", label: "Nomor WhatsApp CS (62xxxxxxxxxx)" },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value;
      });
      setValues(map);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    for (const field of FIELDS) {
      await supabase
        .from("site_settings")
        .update({ value: values[field.key] || "" })
        .eq("key", field.key);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-mist/60">Memuat pengaturan...</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-mist">Pengaturan Website</h1>
      <form onSubmit={handleSave} className="card flex max-w-lg flex-col gap-4 p-6">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm text-mist/70">{f.label}</label>
            <input
              className="input-field"
              value={values[f.key] || ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <button className="btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan Pengaturan"}
        </button>
      </form>
      <p className="mt-4 max-w-lg text-sm text-mist/50">
        Perubahan rekening di sini otomatis muncul di halaman checkout toko.
        Untuk mengubah nama toko yang muncul di navbar, ubah juga env
        <code className="mx-1 rounded bg-surface2 px-1.5 py-0.5">NEXT_PUBLIC_SITE_NAME</code>
        di Vercel lalu redeploy.
      </p>
    </div>
  );
}
