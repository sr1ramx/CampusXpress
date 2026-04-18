-- CampusXpress Supabase schema
-- Apply before rpc.sql and policies.sql

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (replaces Mongo User collection fields except password)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text not null default '',
  language text not null default 'en',
  preferences jsonb not null default '{"notifications": true, "darkMode": false, "accountPreferences": ""}'::jsonb,
  points integer not null default 0,
  role text not null default 'user' check (role in ('user', 'partner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.wallet_transactions (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('earn', 'redeem')),
  points integer not null check (points > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_user_created_at
  on public.wallet_transactions(user_id, created_at desc);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Preparing' check (status in ('Preparing', 'Out for delivery', 'Delivered')),
  priority boolean not null default false,
  delivery_type text not null default 'Instant' check (delivery_type in ('Instant', 'Scheduled')),
  scheduled_date text not null default '',
  scheduled_time text not null default '',
  pre_order_slot text not null default 'ASAP',
  payment_method text not null default 'UPI' check (payment_method in ('UPI', 'Card', 'Wallet', 'Cash')),
  payment_status text not null default 'Requested' check (payment_status in ('Requested', 'Paid')),
  location_lat double precision not null,
  location_lng double precision not null,
  location_address text not null default 'Campus Zone',
  location_block text not null default 'Main Block',
  location_room text not null default '',
  eta_minutes integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists idx_orders_user_created_at
  on public.orders(user_id, created_at desc);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  category text not null default 'Grocery' check (category in ('Food', 'Grocery', 'Stationery', 'Library')),
  price numeric(12,2) not null default 0,
  quantity integer not null default 1,
  borrow_days integer not null default 0,
  return_date text not null default ''
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

create table if not exists public.order_chat_messages (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'partner', 'admin')),
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_chat_order_created
  on public.order_chat_messages(order_id, created_at asc);

-- Recycling
create table if not exists public.recycling_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  material text not null check (material in ('plastic', 'paper', 'metal')),
  item_type text not null default '',
  quantity integer not null default 1,
  size_type text not null default '',
  weight numeric(12,2) not null default 0,
  carbon_saved numeric(12,2) not null default 0,
  status text not null default 'Requested' check (status in ('Requested', 'Picked', 'Processed')),
  scheduled_at text not null default 'Today',
  location_lat double precision not null,
  location_lng double precision not null,
  location_address text not null default 'Campus Recycling Point',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_recycling_updated_at
before update on public.recycling_requests
for each row execute function public.set_updated_at();

create index if not exists idx_recycling_user_created_at
  on public.recycling_requests(user_id, created_at desc);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  recycling_id uuid references public.recycling_requests(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'In Transit', 'Completed')),
  route_start_lat double precision not null default 12.9716,
  route_start_lng double precision not null default 77.5946,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_task_target check (order_id is not null or recycling_id is not null)
);

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create index if not exists idx_tasks_status_created on public.tasks(status, created_at desc);
create index if not exists idx_tasks_order_id on public.tasks(order_id);
create index if not exists idx_tasks_recycling_id on public.tasks(recycling_id);

create table if not exists public.task_stops (
  id bigserial primary key,
  task_id uuid not null references public.tasks(id) on delete cascade,
  kind text not null check (kind in ('delivery', 'recycling')),
  lat double precision not null,
  lng double precision not null,
  address text not null default '',
  stop_order integer not null default 1
);

create index if not exists idx_task_stops_task on public.task_stops(task_id, stop_order);

-- Rentals
create table if not exists public.rent_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'Other',
  condition text not null default 'Good',
  location text not null default 'Campus',
  price_per_day numeric(12,2) not null check (price_per_day > 0),
  images text[] not null default '{}',
  availability boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_rent_items_updated_at
before update on public.rent_items
for each row execute function public.set_updated_at();

create table if not exists public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  rent_item_id uuid not null references public.rent_items(id) on delete cascade,
  lender_id uuid not null references public.profiles(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  duration_days integer not null check (duration_days > 0),
  negotiated_price_per_day numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null,
  contact text not null default '',
  status text not null default 'Requested' check (status in ('Requested', 'Approved', 'Rejected', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_rental_requests_updated_at
before update on public.rental_requests
for each row execute function public.set_updated_at();

create table if not exists public.rental_messages (
  id bigserial primary key,
  rental_request_id uuid not null references public.rental_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('lender', 'renter')),
  text text not null default '',
  offered_price_per_day numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_rental_messages_req_created
  on public.rental_messages(rental_request_id, created_at asc);

-- Books (static list kept in DB for convenience)
create table if not exists public.books (
  id text primary key,
  title text not null,
  author text not null
);

insert into public.books (id, title, author)
values
  ('b1', 'Clean Code', 'Robert C. Martin'),
  ('b2', 'Designing Data-Intensive Applications', 'Martin Kleppmann'),
  ('b3', 'The Pragmatic Programmer', 'Hunt & Thomas')
on conflict (id) do update set title = excluded.title, author = excluded.author;
