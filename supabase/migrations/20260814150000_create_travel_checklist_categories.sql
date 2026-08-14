create table public.travel_checklist_categories (
  slug text primary key check (slug ~ '^[a-z0-9_]+$'),
  label text not null check (length(trim(label)) between 1 and 80),
  sort_order integer not null unique check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.travel_checklist_categories (slug, label, sort_order)
values
  ('comida', 'Alimentación', 10),
  ('higiene', 'Pañal e higiene', 20),
  ('cambio', 'Ropa y cambio', 30),
  ('sueno', 'Sueño y descanso', 40),
  ('salud', 'Salud y medicación', 50),
  ('paseo', 'Paseo y juego', 60),
  ('documentacion', 'Documentación', 70);

alter table public.travel_checklist_items
  drop constraint travel_checklist_items_category_check,
  add constraint travel_checklist_items_category_fkey
    foreign key (category) references public.travel_checklist_categories (slug);

update public.travel_checklist_items
set label = case label
  when 'Cambiador portatil' then 'Cambiador portátil'
  when 'Muselinas 3 pequeñas y 2 grandes' then 'Muselinas: 3 pequeñas y 2 grandes'
  when 'Bodys' then 'Bodies'
  when 'Weleda' then 'Crema Weleda'
  when 'Suero' then 'Suero fisiológico'
  when 'Termometro' then 'Termómetro'
  when 'Émbolo nasal' then 'Jeringa para lavados nasales'
  when 'Carpeta rosa de documentación' then 'Carpeta rosa con documentación'
  else label
end,
updated_at = now()
where label in (
  'Cambiador portatil',
  'Muselinas 3 pequeñas y 2 grandes',
  'Bodys',
  'Weleda',
  'Suero',
  'Termometro',
  'Émbolo nasal',
  'Carpeta rosa de documentación'
);

alter table public.travel_checklist_categories enable row level security;
revoke all on table public.travel_checklist_categories from anon, authenticated;
