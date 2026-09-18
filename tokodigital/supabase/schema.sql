-- =========================================================
-- SKEMA DATABASE TOKODIGITAL
-- Jalankan file ini di Supabase Dashboard > SQL Editor > New query > Run
-- =========================================================

-- 1. PROFILES: data tambahan untuk setiap user (role, nama, dsb)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'seller', 'admin')),
  created_at timestamptz not null default now()
);

-- 2. STORE_APPLICATIONS: pengajuan daftar toko (menunggu approval admin)
create table if not exists store_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_name text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- 3. PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  category text not null default 'lainnya',
  price numeric(12,2) not null,
  stock integer not null default 0,
  image_url text,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now()
);

-- 4. ORDERS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null, -- beberapa baris bisa berbagi order_code yang sama (1 checkout bisa berisi beberapa produk)
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_contact text not null,
  product_id uuid references products(id) on delete set null,
  product_name_snapshot text not null,
  qty integer not null default 1,
  total numeric(12,2) not null,
  status text not null default 'menunggu_pembayaran'
    check (status in ('menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'selesai', 'dibatalkan')),
  payment_proof_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_order_code on orders (order_code);

-- 5. SITE_SETTINGS: pengaturan umum (rekening transfer, dsb), disimpan sebagai key/value
create table if not exists site_settings (
  key text primary key,
  value text
);

insert into site_settings (key, value) values
  ('site_name', 'TokoDigital'),
  ('bank_name', 'BCA'),
  ('bank_account_number', '1234567890'),
  ('bank_account_holder', 'Nama Pemilik Toko'),
  ('whatsapp_cs', '6281234567890')
on conflict (key) do nothing;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table store_applications enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table site_settings enable row level security;

-- profiles: user boleh lihat/ubah profil sendiri; admin boleh lihat semua
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- store_applications: user boleh insert & lihat punya sendiri; admin boleh semua
drop policy if exists "store_app_insert_own" on store_applications;
create policy "store_app_insert_own" on store_applications
  for insert with check (auth.uid() = user_id);
drop policy if exists "store_app_select_own_or_admin" on store_applications;
create policy "store_app_select_own_or_admin" on store_applications
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "store_app_update_admin_only" on store_applications;
create policy "store_app_update_admin_only" on store_applications
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- products: siapa saja boleh lihat produk aktif; hanya admin yang boleh insert/update/delete
drop policy if exists "products_select_public" on products;
create policy "products_select_public" on products
  for select using (status = 'active' or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "products_write_admin_only" on products;
create policy "products_write_admin_only" on products
  for insert with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "products_update_admin_only" on products;
create policy "products_update_admin_only" on products
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "products_delete_admin_only" on products;
create policy "products_delete_admin_only" on products
  for delete using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- orders: siapa saja (termasuk guest lewat anon key) boleh membuat order;
-- customer boleh lihat order miliknya sendiri (by customer_id) atau lookup by order_code lewat halaman cek transaksi;
-- hanya admin yang boleh update status
drop policy if exists "orders_insert_anyone" on orders;
create policy "orders_insert_anyone" on orders
  for insert with check (true);
drop policy if exists "orders_select_own_or_admin" on orders;
create policy "orders_select_own_or_admin" on orders
  for select using (
    auth.uid() = customer_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "orders_update_admin_only" on orders;
create policy "orders_update_admin_only" on orders
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- site_settings: siapa saja boleh baca; hanya admin boleh ubah
drop policy if exists "settings_select_public" on site_settings;
create policy "settings_select_public" on site_settings
  for select using (true);
drop policy if exists "settings_update_admin_only" on site_settings;
create policy "settings_update_admin_only" on site_settings
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =========================================================
-- TRIGGER: otomatis buat baris profiles saat ada user baru daftar
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- STORAGE BUCKET untuk bukti transfer
-- =========================================================
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

drop policy if exists "payment_proofs_public_read" on storage.objects;
create policy "payment_proofs_public_read" on storage.objects
  for select using (bucket_id = 'payment-proofs');
drop policy if exists "payment_proofs_anyone_upload" on storage.objects;
create policy "payment_proofs_anyone_upload" on storage.objects
  for insert with check (bucket_id = 'payment-proofs');

-- =========================================================
-- CARA MEMBUAT AKUN ADMIN (lakukan MANUAL, sekali saja):
-- 1. Buka Supabase Dashboard > Authentication > Users > Add user
--    (isi email & password admin Anda sendiri, centang "Auto Confirm User")
-- 2. Salin User UID yang muncul.
-- 3. Jalankan query di bawah ini, ganti 'UUID_ADMIN_DISINI' dengan UID tadi:
--
--    update profiles set role = 'admin' where id = 'UUID_ADMIN_DISINI';
--
-- 4. Login ke /admin/login pakai email & password yang tadi dibuat.
-- =========================================================

-- Contoh data produk awal (opsional, boleh dihapus)
insert into products (name, slug, description, category, price, stock, image_url, status) values
  ('Akun Premium Streaming 1 Bulan', 'akun-premium-streaming-1-bulan', 'Akun streaming premium garansi 30 hari, langsung terkirim otomatis setelah pembayaran diverifikasi.', 'akun', 35000, 50, null, 'active'),
  ('Jasa Desain Logo', 'jasa-desain-logo', 'Desain logo custom, 2x revisi, format PNG + vector.', 'jasa', 150000, 10, null, 'active'),
  ('Top Up Saldo Voucher 50rb', 'top-up-saldo-voucher-50rb', 'Voucher digital senilai Rp 50.000, kode dikirim via email/WhatsApp.', 'voucher', 50000, 100, null, 'active')
on conflict (slug) do nothing;

-- =========================================================
-- SALDO MERCHANT: klaim saldo & pencairan (dompet penjual)
-- Aman dijalankan ulang (idempotent) di atas database yang sudah ada.
-- =========================================================

-- profiles: tambah kolom saldo
alter table profiles add column if not exists balance numeric(12,2) not null default 0;

-- orders: tambah kolom seller_id (diisi otomatis dari produk saat order dibuat)
alter table orders add column if not exists seller_id uuid references auth.users(id) on delete set null;
create index if not exists idx_orders_seller_id on orders (seller_id);

create or replace function public.set_order_seller_id()
returns trigger as $$
begin
  if new.product_id is not null then
    select seller_id into new.seller_id from products where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_set_order_seller_id on orders;
create trigger trg_set_order_seller_id
  before insert on orders
  for each row execute procedure public.set_order_seller_id();

-- backfill seller_id untuk order yang sudah ada sebelumnya
update orders o set seller_id = p.seller_id
from products p
where o.product_id = p.id and o.seller_id is null;

-- BALANCE_CLAIMS: merchant mengajukan klaim saldo dari pesanan berstatus 'selesai'
create table if not exists balance_claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_balance_claims_seller_id on balance_claims (seller_id);
create index if not exists idx_balance_claims_order_id on balance_claims (order_id);

-- hanya boleh ada 1 klaim aktif (pending/approved) per pesanan, tapi boleh diajukan
-- ulang jika klaim sebelumnya ditolak
create unique index if not exists idx_balance_claims_order_active
  on balance_claims (order_id)
  where status in ('pending', 'approved');

-- WITHDRAWALS: merchant mengajukan pencairan saldo dari dompetnya
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  bank_name text not null,
  bank_account_number text not null,
  bank_account_holder text not null,
  status text not null default 'pending'
    check (status in ('pending', 'diproses', 'selesai', 'ditolak')),
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_withdrawals_seller_id on withdrawals (seller_id);

-- trigger: saat admin menyetujui klaim saldo -> saldo merchant otomatis bertambah
create or replace function public.handle_balance_claim_update()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update profiles set balance = balance + new.amount where id = new.seller_id;
    new.reviewed_at = now();
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.reviewed_at = now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_balance_claim_update on balance_claims;
create trigger trg_balance_claim_update
  before update on balance_claims
  for each row execute procedure public.handle_balance_claim_update();

-- trigger: saat admin menandai pencairan 'selesai' -> saldo merchant otomatis berkurang
create or replace function public.handle_withdrawal_update()
returns trigger as $$
begin
  if new.status = 'selesai' and old.status is distinct from 'selesai' then
    update profiles set balance = balance - new.amount where id = new.seller_id;
    new.processed_at = now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_withdrawal_update on withdrawals;
create trigger trg_withdrawal_update
  before update on withdrawals
  for each row execute procedure public.handle_withdrawal_update();

-- RLS
alter table balance_claims enable row level security;
alter table withdrawals enable row level security;

-- orders: tambahkan akses baca untuk seller (pemilik produk di pesanan tsb)
drop policy if exists "orders_select_own_or_admin" on orders;
create policy "orders_select_own_or_admin" on orders
  for select using (
    auth.uid() = customer_id
    or auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- profiles: admin boleh update profil siapa saja (mis. saldo, role)
drop policy if exists "profiles_update_admin_only" on profiles;
create policy "profiles_update_admin_only" on profiles
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- balance_claims: seller boleh mengajukan klaim untuk pesanan miliknya yang sudah 'selesai',
-- dengan jumlah harus sama persis dengan total pesanan tsb
drop policy if exists "balance_claims_insert_own" on balance_claims;
create policy "balance_claims_insert_own" on balance_claims
  for insert with check (
    auth.uid() = seller_id
    and exists (
      select 1 from orders o
      where o.id = order_id
        and o.seller_id = auth.uid()
        and o.status = 'selesai'
        and o.total = amount
    )
  );
drop policy if exists "balance_claims_select_own_or_admin" on balance_claims;
create policy "balance_claims_select_own_or_admin" on balance_claims
  for select using (
    auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "balance_claims_update_admin_only" on balance_claims;
create policy "balance_claims_update_admin_only" on balance_claims
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- withdrawals: seller boleh mengajukan pencairan atas nama dirinya sendiri;
-- hanya admin yang boleh mengubah status (proses & tandai selesai)
drop policy if exists "withdrawals_insert_own" on withdrawals;
create policy "withdrawals_insert_own" on withdrawals
  for insert with check (auth.uid() = seller_id);
drop policy if exists "withdrawals_select_own_or_admin" on withdrawals;
create policy "withdrawals_select_own_or_admin" on withdrawals
  for select using (
    auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists "withdrawals_update_admin_only" on withdrawals;
create policy "withdrawals_update_admin_only" on withdrawals
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =========================================================
-- PRODUK MANDIRI UNTUK MERCHANT
-- Merchant (role 'seller') boleh kelola produk miliknya sendiri
-- (tambah/ubah/sembunyikan/hapus), tapi TIDAK bisa menyentuh produk
-- merchant lain. Admin tetap bisa kelola/hapus produk siapa saja
-- (untuk moderasi produk ilegal / tidak pantas).
-- Aman dijalankan ulang (idempotent).
-- =========================================================

-- select: produk aktif terlihat publik; pemilik & admin bisa lihat produk
-- miliknya sendiri meski disembunyikan (status = 'hidden')
drop policy if exists "products_select_public" on products;
create policy "products_select_public" on products
  for select using (
    status = 'active'
    or auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- insert: seller boleh tambah produk atas namanya sendiri (role harus
-- 'seller' atau 'admin'); admin juga boleh tambah produk toko resmi
-- (seller_id kosong / atas nama merchant lain jika perlu)
drop policy if exists "products_write_admin_only" on products;
drop policy if exists "products_insert_own_or_admin" on products;
create policy "products_insert_own_or_admin" on products
  for insert with check (
    (
      auth.uid() = seller_id
      and exists (
        select 1 from profiles p
        where p.id = auth.uid() and p.role in ('seller', 'admin')
      )
    )
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- update: seller hanya boleh ubah produk miliknya sendiri; admin bebas
drop policy if exists "products_update_admin_only" on products;
drop policy if exists "products_update_own_or_admin" on products;
create policy "products_update_own_or_admin" on products
  for update using (
    auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- delete: seller hanya boleh hapus produk miliknya sendiri; admin bebas
-- hapus produk siapa saja (moderasi produk ilegal / tidak pantas)
drop policy if exists "products_delete_admin_only" on products;
drop policy if exists "products_delete_own_or_admin" on products;
create policy "products_delete_own_or_admin" on products
  for delete using (
    auth.uid() = seller_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
