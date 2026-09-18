export type Product = {
  id: string;
  seller_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  status: "active" | "hidden";
  created_at: string;
};

export type Order = {
  id: string;
  order_code: string;
  customer_id: string | null;
  customer_name: string;
  customer_contact: string;
  product_id: string | null;
  product_name_snapshot: string;
  qty: number;
  total: number;
  status:
    | "menunggu_pembayaran"
    | "menunggu_verifikasi"
    | "diproses"
    | "selesai"
    | "dibatalkan";
  payment_proof_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreApplication = {
  id: string;
  user_id: string;
  store_name: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function generateOrderCode(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TD-${ymd}-${rand}`;
}

export const ORDER_STATUS_LABEL: Record<Order["status"], string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi: "Menunggu Verifikasi",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};
