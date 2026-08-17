create table public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('nap', 'night')),
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sleep_entries_ends_after_start check (ended_at is null or ended_at > started_at)
);

create index sleep_entries_started_at_idx on public.sleep_entries (started_at desc);
create unique index sleep_entries_single_active_idx on public.sleep_entries ((true)) where ended_at is null;

alter table public.sleep_entries enable row level security;

revoke all on table public.sleep_entries from anon, authenticated;
