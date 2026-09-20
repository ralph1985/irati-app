create table public.friend_entries (
  id text primary key,
  group_label text,
  adults_label text not null check (length(btrim(adults_label)) > 0),
  children_label text not null check (length(btrim(children_label)) > 0),
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index friend_entries_group_sort_idx
  on public.friend_entries (group_label, sort_order);

alter table public.friend_entries enable row level security;
revoke all on table public.friend_entries from anon, authenticated;

insert into public.friend_entries (id, group_label, adults_label, children_label, sort_order)
values
  ('kamikazes-jota-paula', 'Kamikazes', 'Jota y Paula', 'Leire', 10),
  ('kamikazes-josemi-almudena', 'Kamikazes', 'Josemi y Almudena', 'Adriana y Julia', 20),
  ('kamikazes-dulce-laura', 'Kamikazes', 'Dulce y Laura', 'Mar e Inés', 30),
  ('kamikazes-carlitos-ana', 'Kamikazes', 'Carlitos y Ana', 'Mauro', 40),
  ('kamikazes-juani-virginia', 'Kamikazes', 'Juani y Virginia', 'Carmen', 50),
  ('kamikazes-marta-paco', 'Kamikazes', 'Marta y Paco', 'Javier y Leonor', 60),
  ('kamikazes-julian-orsy', 'Kamikazes', 'Julián y Orsy', 'Yulian', 70),
  ('kamikazes-cristina-javi', 'Kamikazes', 'Cristina y Javi', 'Mateo y Adrián', 80),
  ('kamikazes-araceli-ricardo', 'Kamikazes', 'Araceli y Ricardo', 'Tirso', 90),
  ('kamikazes-pedro-marta', 'Kamikazes', 'Pedro y Marta', 'Lucía y Jaime', 100),
  ('kamikazes-tamara-carlos', 'Kamikazes', 'Tamara y Carlos', 'Alejandro', 110),
  ('kamikazes-manguta-alicia', 'Kamikazes', 'Manguta y Alicia', 'Lola', 120),
  ('palomares-coral-david', 'Palomares', 'Coral y David', 'Darío', 130),
  ('palomares-natalia-jonathan', 'Palomares', 'Natalia y Jonathan', 'Marek', 140),
  ('palomares-cristina-alejandro', 'Palomares', 'Cristina y Alejandro', 'Olivia', 150),
  ('palomares-jaime-arganda', 'Palomares', 'Jaime (Arganda)', 'Jacobo', 160),
  ('sin-grupo-maricruz-diego', null, 'Maricruz y Diego', 'Izan', 170),
  ('meco-nacho-bea', 'Meco', 'Nacho y Bea (Meco)', 'Macarena', 180),
  ('bbva-bea-mo2o', 'BBVA', 'Bea (MO2O/BBVA)', 'Nerea', 190),
  ('toledo-cristina-david', 'Toledo', 'Cristina y David', 'Bruno y Daniel', 200),
  ('toledo-alberto-alejandra', 'Toledo', 'Alberto y Alejandra', 'Enzo', 210),
  ('toledo-alicia-jose-manuel', 'Toledo', 'Alicia y Jose Manuel', 'Marco', 220),
  ('toledo-cristina-carlos-suizos', 'Toledo', 'Cristina y Carlos (suizos)', 'Olivia y Nico', 230),
  ('belmontejo-jesus-vanesa', 'Belmontejo', 'Jesús y Vanesa', 'Julen', 240);
