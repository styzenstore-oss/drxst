# TokoDigital — Marketplace Produk Digital

Website toko online (Next.js + Supabase) dengan halaman customer (katalog,
keranjang, checkout manual transfer, cek transaksi, daftar toko) dan halaman
admin penuh (kelola produk, pesanan, approval pengajuan toko, pengaturan
rekening).

> Catatan penting: proyek ini **terinspirasi dari alur & fitur** situs
> marketplace produk digital semacam rifalosid.com, tapi dibangun dengan
> branding, nama, dan aset visual sendiri (bukan salinan identik) — logo dan
> ilustrasi berkarakter dari pihak lain adalah hak cipta orang lain sehingga
> tidak disalin di sini. Silakan ganti nama, warna, dan logo sesuai brand
> Anda sendiri.

## 0. Fitur Saldo & Pencairan Merchant

Proyek ini sudah memiliki fitur dompet merchant: setelah pesanan berstatus
"Selesai", merchant bisa klaim saldo dari halaman **Toko Saya**
(`/toko-saya`), admin menyetujuinya di **Admin > Klaim Saldo**, saldo
otomatis masuk ke halaman **Dompet Saya** (`/toko-saya/dompet`), lalu
merchant bisa mengajukan pencairan di halaman yang sama. Permintaan
pencairan muncul dengan notifikasi (badge) di **Admin > Pencairan**; begitu
admin mengubah status menjadi "Selesai", saldo merchant otomatis terpotong
dan tersimpan sebagai riwayat pencairan.

Jika database Anda sudah pernah dibuat sebelumnya, cukup jalankan ulang
seluruh isi `supabase/schema.sql` di SQL Editor — bagian baru (kolom saldo,
tabel `balance_claims` & `withdrawals`, trigger, RLS) aman dijalankan ulang
(idempotent) dan tidak akan menghapus data yang sudah ada.

## 1. Isi Environment Variable

1. Salin `.env.example` menjadi `.env.local`.
2. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari
   Supabase Dashboard > Project Settings > API.
3. `NEXT_PUBLIC_SITE_NAME` bisa diisi nama toko Anda.

## 2. Setup Database Supabase

1. Buka Supabase Dashboard > SQL Editor > New query.
2. Copy seluruh isi file `supabase/schema.sql`, paste, lalu klik **Run**.
   File ini otomatis membuat semua tabel, keamanan (RLS), bucket
   penyimpanan bukti transfer, trigger, dan beberapa contoh produk.

## 3. Membuat Akun Admin (sekali saja)

Supabase Auth tidak bisa dibuatkan user lewat SQL biasa, jadi lakukan ini:

1. Supabase Dashboard > Authentication > Users > **Add user**.
2. Isi email & password admin Anda, centang **Auto Confirm User**, simpan.
3. Salin **User UID** akun tersebut.
4. Kembali ke SQL Editor, jalankan:
   ```sql
   update profiles set role = 'admin' where id = 'UUID_ADMIN_DISINI';
   ```
5. Selesai — login admin di `/admin/login` pakai email & password tadi.
   Tidak perlu proses daftar lagi untuk admin.

## 4. Jalankan di Lokal (opsional, untuk cek sebelum deploy)

```bash
npm install
npm run dev
```
Buka http://localhost:3000

## 5. Deploy ke Vercel via GitHub

1. Buat repository baru di GitHub, upload semua isi folder ini.
2. Buka [vercel.com](https://vercel.com) > New Project > Import repo GitHub
   Anda.
3. Saat setup, tambahkan Environment Variables yang sama seperti di
   `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   NEXT_PUBLIC_SITE_NAME).
4. Klik **Deploy**. Vercel otomatis build Next.js project ini.
5. Setiap kali Anda push perubahan ke GitHub, Vercel otomatis deploy ulang.

## Struktur Halaman

**Customer**
- `/` — Beranda + katalog produk (filter kategori & pencarian)
- `/product/[slug]` — Detail produk
- `/cart` — Keranjang belanja
- `/checkout` — Isi data pemesan, lihat info rekening, upload bukti transfer
- `/orders` — Cek status transaksi pakai kode pesanan (tanpa perlu login)
- `/login`, `/register` — Akun customer (opsional untuk belanja)
- `/daftar-toko` — Ajukan pembukaan toko (butuh login, ditinjau admin)

**Admin** (semua butuh login admin, dilindungi oleh `app/admin/layout.tsx`)
- `/admin/login` — Login khusus admin
- `/admin` — Dashboard ringkasan
- `/admin/products` — Tambah/edit/hapus produk
- `/admin/orders` — Lihat pesanan, ubah status, lihat bukti transfer
- `/admin/toko` — Setujui/tolak pengajuan buka toko
- `/admin/settings` — Ubah info rekening & pengaturan situs

## Yang Masih Perlu Anda Lengkapi

- **Payment gateway otomatis** (Midtrans dkk) belum diintegrasikan — saat
  ini pembayaran manual transfer + upload bukti + verifikasi manual oleh
  admin. Bisa ditambahkan menyusul.
- **Pengiriman otomatis produk digital** (misal kirim kode voucher via
  email otomatis setelah status "selesai") belum ada — saat ini admin
  mengirim manual setelah verifikasi.
- **Logo & warna brand** masih placeholder, silakan sesuaikan di
  `tailwind.config.js` (warna) dan `.env.local` (nama toko).
- Verifikasi email saat daftar bergantung pada pengaturan Supabase Auth
  Anda (Authentication > Providers > Email).
