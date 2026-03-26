
create table if not exists webhook_debug (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  event_type text,
  payload jsonb
);

alter table webhook_debug enable row level security;

create policy "Enable insert for authenticated users only"
on webhook_debug for insert
to authenticated, service_role
with check (true);

create policy "Enable read for service role only"
on webhook_debug for select
to service_role
using (true);
