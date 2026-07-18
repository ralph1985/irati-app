create table public.travel_checklist_items (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) between 1 and 120),
  category text not null check (
    category in ('comida', 'higiene', 'cambio', 'sueno', 'salud', 'paseo', 'documentacion')
  ),
  sort_order integer not null default 0,
  is_packed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index travel_checklist_items_category_order_idx
  on public.travel_checklist_items (category asc, sort_order asc, created_at asc);

create index travel_checklist_items_is_packed_idx
  on public.travel_checklist_items (is_packed);

insert into public.travel_checklist_items (label, category, sort_order, notes)
values
  ('Biberon o toma preparada', 'comida', 10, null),
  ('Agua', 'comida', 20, null),
  ('Babero o muselina', 'comida', 30, null),
  ('Pañales', 'higiene', 10, null),
  ('Toallitas', 'higiene', 20, null),
  ('Crema de pañal', 'higiene', 30, null),
  ('Cambiador portatil', 'cambio', 10, null),
  ('Ropa de cambio', 'cambio', 20, null),
  ('Bolsa para ropa sucia', 'cambio', 30, null),
  ('Chupete', 'sueno', 10, null),
  ('Mantita', 'sueno', 20, null),
  ('Pijama o saco', 'sueno', 30, null),
  ('Tarjeta sanitaria', 'salud', 10, null),
  ('Termometro', 'salud', 20, null),
  ('Medicacion si aplica', 'salud', 30, null),
  ('Carrito o portabebe', 'paseo', 10, null),
  ('Sombrilla o protector de lluvia', 'paseo', 20, null),
  ('Juguete pequeño', 'paseo', 30, null),
  ('DNI o libro de familia si aplica', 'documentacion', 10, null),
  ('Documentos de viaje', 'documentacion', 20, null);
