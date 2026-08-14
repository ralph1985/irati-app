create or replace function public.reorder_travel_checklist_items(p_items jsonb)
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
    raise exception 'Travel reorder payload must be an array';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    update public.travel_checklist_items
    set
      category = item->>'category',
      sort_order = (item->>'sortOrder')::integer,
      updated_at = now()
    where id = (item->>'id')::uuid;

    get diagnostics updated_count = row_count;
    if updated_count <> 1 then
      raise exception 'Travel item not found';
    end if;
  end loop;
end;
$$;

revoke all on function public.reorder_travel_checklist_items(jsonb) from public, anon, authenticated;
grant execute on function public.reorder_travel_checklist_items(jsonb) to service_role;
