"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { totalItems } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TokoDigital";

  useEffect(() => {
    async function loadUser(userId: string | undefined, email: string | null) {
      setUserEmail(email);
      if (!userId) {
        setIsSeller(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      setIsSeller(profile?.role === "seller");
    }

    supabase.auth.getUser().then(({ data }) => {
      loadUser(data.user?.id, data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user?.id, session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/?q=${encodeURIComponent(query)}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
      <div className="container-page flex items-center gap-4 py-3">
        <Link href="/" className="shrink-0 font-display text-xl font-bold tracking-tight text-mist">
          {siteName}
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:block">
          <input
            className="input-field"
            placeholder="Cari produk digital, akun, atau jasa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <nav className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/orders" className="hidden text-mist/80 hover:text-mist sm:block">
            Cek Transaksi
          </Link>
          {isSeller ? (
            <Link href="/toko-saya" className="hidden text-mist/80 hover:text-mist sm:block">
              Toko Saya
            </Link>
          ) : (
            <Link href="/daftar-toko" className="hidden text-mist/80 hover:text-mist sm:block">
              Buka Toko
            </Link>
          )}
          <Link href="/cart" className="relative rounded-lg border border-line px-3 py-1.5 hover:border-brand">
            Keranjang
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber text-xs font-bold text-ink">
                {totalItems}
              </span>
            )}
          </Link>
          {userEmail ? (
            <button onClick={handleLogout} className="btn-outline !py-1.5 !px-3 text-sm">
              Keluar
            </button>
          ) : (
            <Link href="/login" className="btn-primary !py-1.5 !px-3 text-sm">
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
