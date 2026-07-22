alter table public.baby_profiles enable row level security;
alter table public.weight_entries enable row level security;
alter table public.planned_vaccine_doses enable row level security;
alter table public.applied_vaccine_doses enable row level security;
alter table public.developer_backup_runs enable row level security;
alter table public.travel_checklist_items enable row level security;

revoke all on table public.baby_profiles from anon, authenticated;
revoke all on table public.weight_entries from anon, authenticated;
revoke all on table public.planned_vaccine_doses from anon, authenticated;
revoke all on table public.applied_vaccine_doses from anon, authenticated;
revoke all on table public.developer_backup_runs from anon, authenticated;
revoke all on table public.travel_checklist_items from anon, authenticated;
