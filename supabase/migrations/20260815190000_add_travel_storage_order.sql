alter table public.travel_checklist_items
  add column storage_sort_order integer;

with ranked_items as (
  select
    id,
    row_number() over (
      partition by storage_location_id
      order by sort_order asc, created_at asc, id asc
    ) * 10 as next_storage_sort_order
  from public.travel_checklist_items
  where storage_location_id is not null
)
update public.travel_checklist_items items
set storage_sort_order = ranked_items.next_storage_sort_order
from ranked_items
where items.id = ranked_items.id;

alter table public.travel_checklist_items
  add constraint travel_checklist_items_storage_sort_order_check
  check (storage_sort_order is null or storage_sort_order >= 0);

create index travel_checklist_items_storage_location_order_idx
  on public.travel_checklist_items (storage_location_id asc, storage_sort_order asc, created_at asc);

create or replace function public.reorder_travel_checklist_items_by_location(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  updated_count integer;
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Travel storage reorder payload must be an array';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    update public.travel_checklist_items
    set
      storage_location_id = nullif(item->>'storageLocationId', '')::uuid,
      storage_sort_order = (item->>'storageSortOrder')::integer,
      updated_at = now()
    where id = (item->>'id')::uuid;

    get diagnostics updated_count = row_count;
    if updated_count <> 1 then
      raise exception 'Travel item not found';
    end if;
  end loop;
end;
$$;

revoke all on function public.reorder_travel_checklist_items_by_location(jsonb) from public, anon, authenticated;
grant execute on function public.reorder_travel_checklist_items_by_location(jsonb) to service_role;
