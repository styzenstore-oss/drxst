"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-xl font-bold text-mist">
          Pendaftaran Berhasil 🎉
        </h1>
        <p className="mt-3 text-mist/70">
          Jika verifikasi email aktif di project Supabase Anda, cek inbox untuk
          konfirmasi. Setelah itu Anda bisa langsung masuk.
        </p>
        <button onClick={() => router.push("/login")} className="btn-primary mt-6">
          Ke Halaman Masuk
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="mb-1 text-center font-display text-2xl font-bold text-mist">
          Daftar Akun
        </h1>
        <p className="mb-6 text-center text-sm text-mist/60">
          Belanja tanpa akun juga tetap bisa lewat halaman produk.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-mist/70">Nama Lengkap</label>
            <input
              required
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mist/70">Email</label>
            <input
              required
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-mist/70">
              No. HP / WhatsApp (opsional)
            </label>
            <input
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-mist/70">Kata Sandi</label>
              <input
                required
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-mist/70">
                Konfirmasi
              </label>
              <input
                required
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-mist/60">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-brand-light hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
