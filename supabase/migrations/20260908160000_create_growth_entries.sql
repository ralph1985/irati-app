create table public.height_entries (
  id uuid primary key default gen_random_uuid(),
  measured_on date not null,
  height_cm smallint not null check (height_cm between 1 and 150),
  place text not null check (place in ('hospital', 'pediatra', 'farmacia')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.head_circumference_entries (
  id uuid primary key default gen_random_uuid(),
  measured_on date not null,
  head_circumference_cm smallint not null check (head_circumference_cm between 1 and 70),
  place text not null check (place in ('hospital', 'pediatra', 'farmacia')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index height_entries_measured_on_idx on public.height_entries (measured_on desc);
create index head_circumference_entries_measured_on_idx
  on public.head_circumference_entries (measured_on desc);

alter table public.height_entries enable row level security;
alter table public.head_circumference_entries enable row level security;

revoke all on table public.height_entries from anon, authenticated;
revoke all on table public.head_circumference_entries from anon, authenticated;

insert into public.height_entries (measured_on, height_cm, place)
values (date '2026-09-08', 57, 'pediatra');

insert into public.head_circumference_entries (measured_on, head_circumference_cm, place)
values (date '2026-09-08', 39, 'pediatra');
