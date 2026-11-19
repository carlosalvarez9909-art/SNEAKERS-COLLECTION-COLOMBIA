create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin'))
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Solo usuarios con sesión pueden consultar si son administradores.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.brands (
  id text primary key,
  name text not null,
  slug text not null unique,
  logo text not null default '',
  story text not null default '',
  hero_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  brand_id text not null references public.brands(id) on update cascade on delete restrict,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  description text not null default '',
  history text not null default '',
  base_price numeric(12, 2) not null check (base_price >= 0),
  discount numeric(5, 2) not null default 0 check (discount between 0 and 100),
  images jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  is_limited boolean not null default false,
  is_best_seller boolean not null default false,
  is_trending boolean not null default false,
  rating numeric(3, 2) not null default 0 check (rating between 0 and 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  materials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  image text not null,
  product_id text not null references public.products(id) on update cascade on delete cascade,
  tag text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(12, 2) not null check (value >= 0),
  valid_from date not null,
  valid_to date not null check (valid_to >= valid_from),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key,
  product_id text not null references public.products(id) on update cascade on delete cascade,
  customer_name text not null,
  rating numeric(2, 1) not null check (rating between 1 and 5),
  comment text not null,
  created_at text not null
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  items jsonb not null,
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'COP',
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  customer_address text not null,
  customer_city text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_imports (
  id text primary key,
  imported_at timestamptz not null default now()
);

create index if not exists products_brand_id_idx on public.products (brand_id);
create index if not exists banners_product_id_idx on public.banners (product_id);
create index if not exists reviews_product_id_idx on public.reviews (product_id);

alter table public.user_roles enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.catalog_imports enable row level security;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Public can read brands" on public.brands;
create policy "Public can read brands"
  on public.brands for select to anon, authenticated using (true);
drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
  on public.brands for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select to anon, authenticated using (true);
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read banners" on public.banners;
create policy "Public can read banners"
  on public.banners for select to anon, authenticated using (true);
drop policy if exists "Admins can manage banners" on public.banners;
create policy "Admins can manage banners"
  on public.banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read coupons" on public.coupons;
create policy "Public can read coupons"
  on public.coupons for select to anon, authenticated using (true);
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews for select to anon, authenticated using (true);
drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews"
  on public.reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read catalog import marker" on public.catalog_imports;
create policy "Admins can read catalog import marker"
  on public.catalog_imports for select to authenticated
  using (public.is_admin());
drop policy if exists "Admins can create catalog import marker" on public.catalog_imports;
create policy "Admins can create catalog import marker"
  on public.catalog_imports for insert to authenticated
  with check (public.is_admin());

grant select on public.brands, public.products, public.banners, public.coupons, public.reviews to anon, authenticated;
grant insert, update, delete on public.brands, public.products, public.banners, public.coupons, public.reviews to authenticated;
grant select, insert on public.catalog_imports to authenticated;
grant select on public.user_roles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
