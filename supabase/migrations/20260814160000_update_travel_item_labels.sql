update public.travel_checklist_items
set
  label = 'Gasa grande para el baño',
  updated_at = now()
where label = 'Gasa grande baño';
