"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/helpers";

const NAV = [
  { href: "/toko-saya", label: "Pesanan Saya" },
  { href: "/toko-saya/produk", label: "Produk Saya" },
  { href: "/toko-saya/dompet", label: "Dompet Saya" },
];

export default function TokoSayaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function checkSeller() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, balance")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profile?.role !== "seller" && profile?.role !== "admin") {
        router.replace("/daftar-toko");
        return;
      }
      setBalance(Number(profile.balance || 0));
      setAuthorized(true);
      setChecked(true);
    }
    checkSeller();
  }, [pathname, router]);

  if (!checked) {
    return <p className="p-8 text-mist/60">Memeriksa akses...</p>;
  }

  if (!authorized) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface p-5 md:min-h-screen md:border-b-0 md:border-r">
        <p className="mb-1 font-display text-lg font-bold text-mist">Toko Saya</p>
        <p className="mb-6 text-xs text-mist/50">
          Saldo: <span className="font-semibold text-amber">{formatRupiah(balance)}</span>
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm ${
                pathname === item.href
                  ? "bg-brand/20 text-brand-light"
                  : "text-mist/70 hover:bg-surface2"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-2 rounded-lg px-3 py-2 text-left text-sm text-mist/60 hover:bg-surface2"
          >
            Kembali ke Toko
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-surface2"
          >
            Keluar
          </button>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
