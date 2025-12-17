-- HygiaAI Supabase Schema (PostgreSQL)
-- Run this in Supabase SQL editor before switching the backend to Supabase mode.

create table if not exists public.customers (
  id text primary key,
  name text not null,
  address text,
  city text,
  phone text,
  email text,
  notes text,
  service_tags jsonb default '[]'::jsonb not null,
  duration_minutes integer,
  frequency text,
  lat double precision,
  lng double precision,
  is_active boolean default true
);

create table if not exists public.employees (
  id text primary key,
  name text not null,
  phone text,
  email text,
  notes text,
  is_active boolean default true
);

create table if not exists public.service_types (
  id text primary key,
  key text not null,
  label text not null,
  color text,
  constraint uq_service_types_key unique (key)
);

create table if not exists public.assignments (
  id text primary key,
  date date not null,
  start_time time,
  employee_id text references public.employees(id) on delete cascade,
  customer_id text references public.customers(id) on delete cascade,
  service_type text,
  status text,
  notes text
);

-- Suggested policies (adjust as needed):
-- alter table public.customers enable row level security;
-- create policy "Enable read for all" on public.customers for select using (true);
-- create policy "Enable write for service role" on public.customers for all using (auth.role() = 'service_role');


