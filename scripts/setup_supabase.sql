-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid not null primary key,
  email text,
  stripe_customer_id text,
  roles jsonb,
  constraint id foreign key (id) references auth.users (id) on delete cascade
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select using (true);

create policy "Users can insert their own profile."
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile."
  on profiles for update using (auth.uid() = id);

-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger as $
begin
  insert into public.profiles (id, email, roles)
  values (new.id, new.email, '{\"VIEWER\": true}');
  return new;
end;
$ language plpgsql security definer;

-- Trigger to run the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table to map Stripe customer IDs to Supabase user IDs for webhooks
create table if not exists public.stripe_customers (
  customer_id text not null primary key,
  user_id uuid not null,
  constraint user_id foreign key (user_id) references auth.users (id) on delete cascade
);
alter table public.stripe_customers enable row level security;
create policy "Stripe customers are not publicly readable" on public.stripe_customers for select using (false);

-- Create table for tenant-like settings, partitioned by user
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.settings enable row level security;
create policy "Users can manage their own settings" on public.settings for all using (auth.uid() = user_id);

-- Create table for calculations
create table if not exists public.calculations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);
alter table public.calculations enable row level security;
create policy "Users can manage their own calculations" on public.calculations for all using (auth.uid() = user_id);

-- Create table for audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;
create policy "Users can view their own audit logs" on public.audit_logs for select using (auth.uid() = user_id);
