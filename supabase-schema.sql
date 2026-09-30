create table if not exists public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  salt text not null,
  encrypted_blob text not null,
  wrapped_key text,
  recovery_salt text,
  recovery_blob text,
  updated_at timestamptz not null default now()
);

alter table public.user_data add column if not exists wrapped_key text;
alter table public.user_data add column if not exists recovery_salt text;
alter table public.user_data add column if not exists recovery_blob text;
alter table public.user_data enable row level security;

drop policy if exists "Users can read their own data" on public.user_data;
drop policy if exists "Users can insert their own data" on public.user_data;
drop policy if exists "Users can update their own data" on public.user_data;
drop policy if exists "Users can delete their own data" on public.user_data;

create policy "Users can read their own data" on public.user_data for select using (auth.uid() = user_id);
create policy "Users can insert their own data" on public.user_data for insert with check (auth.uid() = user_id);
create policy "Users can update their own data" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own data" on public.user_data for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_user_data_updated_at on public.user_data;
create trigger set_user_data_updated_at before update on public.user_data
for each row execute function public.set_updated_at();
