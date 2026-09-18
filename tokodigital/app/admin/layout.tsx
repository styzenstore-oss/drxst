"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/toko", label: "Pengajuan Toko" },
  { href: "/admin/settings", label: "Pengaturan" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (pathname === "/admin/login") {
        setChecked(true);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/admin/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        router.replace("/admin/login");
        return;
      }
      setAuthorized(true);
      setChecked(true);
    }
    checkAdmin();
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (!checked) {
    return <p className="p-8 text-mist/60">Memeriksa akses...</p>;
  }

  if (!authorized) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface p-5 md:min-h-screen md:border-b-0 md:border-r">
        <p className="mb-6 font-display text-lg font-bold text-mist">Admin Panel</p>
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
          <button
            onClick={handleLogout}
            className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-surface2"
          >
            Keluar
          </button>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
