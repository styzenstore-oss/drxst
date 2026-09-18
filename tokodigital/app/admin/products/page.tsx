"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product, formatRupiah } from "@/lib/helpers";

const EMPTY_FORM = {
  id: "",
  name: "",
  description: "",
  category: "lainnya",
  price: "",
  stock: "",
  image_url: "",
  status: "active" as "active" | "hidden",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function startEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      image_url: p.image_url || "",
      status: p.status,
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url || null,
      status: form.status,
    };

    const result = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    resetForm();
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-mist">Kelola Produk</h1>

      <form onSubmit={handleSubmit} className="card mb-8 grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-mist/70">Nama Produk</label>
          <input
            required
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-mist/70">Deskripsi</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-mist/70">Kategori</label>
          <select
            className="input-field"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="akun">Akun</option>
            <option value="jasa">Jasa</option>
            <option value="voucher">Voucher</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-mist/70">Status</label>
          <select
            className="input-field"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as "active" | "hidden" })
            }
          >
            <option value="active">Aktif</option>
            <option value="hidden">Disembunyikan</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-mist/70">Harga (Rp)</label>
          <input
            required
            type="number"
            className="input-field"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-mist/70">Stok</label>
          <input
            required
            type="number"
            className="input-field"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-mist/70">
            URL Gambar (opsional)
          </label>
          <input
            className="input-field"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}

        <div className="flex gap-3 sm:col-span-2">
          <button className="btn-primary">
            {editing ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="btn-outline">
              Batal
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-mist/60">Memuat produk...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-semibold text-mist">{p.name}</p>
                <p className="text-sm text-mist/60">
                  {formatRupiah(p.price)} · Stok {p.stock} · {p.category} ·{" "}
                  <span className={p.status === "active" ? "text-green-400" : "text-mist/40"}>
                    {p.status === "active" ? "Aktif" : "Disembunyikan"}
                  </span>
                </p>
              </div>
              <button onClick={() => startEdit(p)} className="btn-outline !py-1.5 !px-3 text-sm">
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
