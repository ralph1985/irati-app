alter table public.weight_entries
  drop constraint if exists weight_entries_place_check;

alter table public.weight_entries
  add constraint weight_entries_place_check
  check (place in ('hospital', 'pediatra', 'farmacia'));
