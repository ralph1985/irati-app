create extension if not exists pgcrypto;

create table public.baby_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  measured_on date not null,
  weight_grams integer not null check (weight_grams between 1000 and 20000),
  place text not null check (place in ('pediatra', 'farmacia')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.planned_vaccine_doses (
  id uuid primary key default gen_random_uuid(),
  vaccine_name text not null,
  dose_label text not null,
  planned_date date not null,
  age_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applied_vaccine_doses (
  id uuid primary key default gen_random_uuid(),
  planned_dose_id uuid references public.planned_vaccine_doses(id) on delete set null,
  applied_on date not null,
  vaccine_name text not null,
  dose_label text not null,
  place text not null,
  lot text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weight_entries_measured_on_idx on public.weight_entries (measured_on desc);
create index planned_vaccine_doses_planned_date_idx on public.planned_vaccine_doses (planned_date asc);
create index applied_vaccine_doses_planned_dose_id_idx on public.applied_vaccine_doses (planned_dose_id);
create index applied_vaccine_doses_applied_on_idx on public.applied_vaccine_doses (applied_on desc);

insert into public.baby_profiles (name, birth_date)
values ('Irati', date '2026-07-02');
