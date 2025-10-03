-- Minimal tables
create table if not exists public.employees (
  id text primary key,
  user_id uuid not null,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

alter table public.employees enable row level security;

create policy "owner can read"
  on public.employees for select using ( auth.uid() = user_id );

create policy "owner can upsert"
  on public.employees for insert with check ( auth.uid() = user_id );

create policy "owner can update"
  on public.employees for update using ( auth.uid() = user_id );

create policy "owner can delete"
  on public.employees for delete using ( auth.uid() = user_id );

