alter table public.travel_checklist_items
  add column packing_status text not null default 'pending';

update public.travel_checklist_items
set packing_status = case when is_packed then 'packed' else 'pending' end;

alter table public.travel_checklist_items
  add constraint travel_checklist_items_packing_status_check
  check (packing_status in ('pending', 'packed', 'not_taking'));

create index travel_checklist_items_packing_status_idx
  on public.travel_checklist_items (packing_status);

alter table public.travel_checklist_items
  drop column is_packed;
