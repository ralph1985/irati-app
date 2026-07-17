create unique index if not exists applied_vaccine_doses_planned_dose_id_unique
  on public.applied_vaccine_doses (planned_dose_id)
  where planned_dose_id is not null;
