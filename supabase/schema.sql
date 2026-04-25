create extension if not exists pgcrypto;

create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo_url text,
  student_code text unique not null,
  weekly_points int default 0,
  monthly_points int default 0,
  all_time_points int default 0,
  tier text default 'Pawn',
  created_at timestamptz default now()
);

create table if not exists logs (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  action_type text not null,
  points int not null,
  created_at timestamptz default now()
);

create table if not exists admins (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role text default 'admin'
);

alter publication supabase_realtime add table students;
alter publication supabase_realtime add table logs;

alter table students enable row level security;
alter table logs enable row level security;
alter table admins enable row level security;

drop policy if exists "v1_allow_all" on students;
drop policy if exists "v1_allow_all" on logs;
drop policy if exists "v1_allow_all" on admins;

create policy "v1_allow_all" on students for all using (true) with check (true);
create policy "v1_allow_all" on logs for all using (true) with check (true);
create policy "v1_allow_all" on admins for all using (true) with check (true);
