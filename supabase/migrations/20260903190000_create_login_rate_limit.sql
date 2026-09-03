create table public.login_rate_limit_buckets (
  client_key text primary key,
  failed_attempts integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint login_rate_limit_buckets_key_check check (client_key ~ '^[a-f0-9]{64}$'),
  constraint login_rate_limit_buckets_attempts_check check (failed_attempts > 0)
);

create index login_rate_limit_buckets_reset_at_idx
  on public.login_rate_limit_buckets (reset_at);

alter table public.login_rate_limit_buckets enable row level security;
revoke all on table public.login_rate_limit_buckets from anon, authenticated;

create or replace function public.reserve_login_attempt(p_client_key text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  allowed boolean;
begin
  if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid login rate-limit key';
  end if;

  delete from public.login_rate_limit_buckets
  where reset_at < now() - interval '1 day';

  insert into public.login_rate_limit_buckets (client_key, failed_attempts, reset_at)
  values (p_client_key, 1, now() + interval '15 minutes')
  on conflict (client_key) do update
  set failed_attempts = case
        when login_rate_limit_buckets.reset_at <= now() then 1
        else login_rate_limit_buckets.failed_attempts + 1
      end,
      reset_at = case
        when login_rate_limit_buckets.reset_at <= now() then now() + interval '15 minutes'
        else login_rate_limit_buckets.reset_at
      end,
      updated_at = now()
  returning failed_attempts <= 5 into allowed;

  return allowed;
end;
$$;

create or replace function public.clear_login_attempts(p_client_key text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_client_key is null or p_client_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid login rate-limit key';
  end if;

  delete from public.login_rate_limit_buckets
  where client_key = p_client_key;
end;
$$;

revoke all on function public.reserve_login_attempt(text) from public, anon, authenticated;
revoke all on function public.clear_login_attempts(text) from public, anon, authenticated;
grant execute on function public.reserve_login_attempt(text) to service_role;
grant execute on function public.clear_login_attempts(text) to service_role;
