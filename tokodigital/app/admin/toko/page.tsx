"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { StoreApplication } from "@/lib/helpers";

export default function AdminTokoPage() {
  const [apps, setApps] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  async function loadApps() {
    setLoading(true);
    const { data } = await supabase
      .from("store_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApps((data as StoreApplication[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadApps();
  }, []);

  async function handleDecision(id: string, status: "approved" | "rejected") {
    const { data: userData } = await supabase.auth.getUser();
    const app = apps.find((a) => a.id === id);

    await supabase
      .from("store_applications")
      .update({
        status,
        admin_note: noteDraft[id] || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Jika disetujui, naikkan role user tersebut menjadi 'seller'
    if (status === "approved" && app) {
      await supabase.from("profiles").update({ role: "seller" }).eq("id", app.user_id);
    }

    loadApps();
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-mist">
        Pengajuan Buka Toko
      </h1>

      {loading ? (
        <p className="text-mist/60">Memuat...</p>
      ) : apps.length === 0 ? (
        <p className="text-mist/60">Belum ada pengajuan.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-mist">{a.store_name}</p>
                  <p className="text-sm text-mist/60">{a.description}</p>
                  <span
                    className={`badge mt-2 ${
                      a.status === "pending"
                        ? "bg-amber/20 text-amber"
                        : a.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                {a.status === "pending" && (
                  <div className="flex w-full flex-col gap-2 sm:w-64">
                    <input
                      placeholder="Catatan (opsional)"
                      className="input-field"
                      value={noteDraft[a.id] || ""}
                      onChange={(e) =>
                        setNoteDraft({ ...noteDraft, [a.id]: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(a.id, "approved")}
                        className="btn-primary flex-1 !py-1.5 text-sm"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleDecision(a.id, "rejected")}
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
