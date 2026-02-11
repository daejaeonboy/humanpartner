-- Drop previous table if exists (to reset schema)
drop table if exists public.notifications;

-- Create notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null, -- Changed to text to support Firebase UID
  title text not null,
  message text not null,
  type text default 'info', -- 'info', 'success', 'warning', 'error'
  is_read boolean default false,
  link_url text, -- Optional link to redirect
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policy: Allow ALL operations for authenticated users (since we can't verify Firebase UID in Supabase RLS easily without custom claims)
-- Ideally, we'd use a custom JWT or Edge Function, but for this client-side demo:
create policy "Allow all operations for public/anon"
  on public.notifications
  for all
  using (true)
  with check (true);
