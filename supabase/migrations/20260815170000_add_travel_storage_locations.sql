create table public.travel_storage_locations (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) between 1 and 80),
  parent_id uuid references public.travel_storage_locations(id) on delete restrict,
  sort_order integer not null default 10 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, label)
);

alter table public.travel_checklist_items
  add column storage_location_id uuid references public.travel_storage_locations(id) on delete set null;

create index travel_storage_locations_parent_order_idx
  on public.travel_storage_locations (parent_id, sort_order);

create index travel_checklist_items_storage_location_idx
  on public.travel_checklist_items (storage_location_id);

alter table public.travel_storage_locations enable row level security;
revoke all on table public.travel_storage_locations from anon, authenticated;
