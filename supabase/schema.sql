create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create table if not exists public.profile (
  id int primary key default 1 check (id = 1),
  name text not null default 'Ezekiel''s Portfolio',
  phone text not null default '+254727550182',
  email text not null default 'gituraezekiel@gmail.com',
  headline text not null default 'Showcase incident response, security research, and hands-on labs.',
  intro text not null default 'A working portfolio hub for PDF reports, blog posts, project writeups, and experience notes.',
  show_starter_projects boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  project_month text not null,
  summary text not null,
  tags text[] not null default '{}',
  type text not null default 'post' check (type in ('post', 'html', 'pdf')),
  body text,
  file_path text,
  file_name text,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.toolkit_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.experience_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profile;
create trigger set_profile_updated_at
before update on public.profile
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.profile enable row level security;
alter table public.projects enable row level security;
alter table public.toolkit_items enable row level security;
alter table public.experience_entries enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Public can read profile" on public.profile;
create policy "Public can read profile"
on public.profile
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can write profile" on public.profile;
create policy "Admins can write profile"
on public.profile
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
on public.projects
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can write projects" on public.projects;
create policy "Admins can write projects"
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read toolkit" on public.toolkit_items;
create policy "Public can read toolkit"
on public.toolkit_items
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can write toolkit" on public.toolkit_items;
create policy "Admins can write toolkit"
on public.toolkit_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read experience" on public.experience_entries;
create policy "Public can read experience"
on public.experience_entries
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can write experience" on public.experience_entries;
create policy "Admins can write experience"
on public.experience_entries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.profile (id, name, phone, email, headline, intro, show_starter_projects)
values (
  1,
  'Ezekiel''s Portfolio',
  '+254727550182',
  'gituraezekiel@gmail.com',
  'Showcase incident response, security research, and hands-on labs.',
  'A working portfolio hub for PDF reports, blog posts, project writeups, and experience notes. Add your own evidence, preview it in place, and let reviewers move through your work without leaving the site.',
  true
)
on conflict (id) do nothing;

insert into public.toolkit_items (name, sort_order)
select name, sort_order
from (
  values
    ('Splunk', 1),
    ('Wireshark', 2),
    ('Nmap', 3),
    ('Burp Suite', 4),
    ('Microsoft Sentinel', 5),
    ('Linux', 6),
    ('Python', 7),
    ('MITRE ATT&CK', 8),
    ('OSINT', 9),
    ('Cloud IAM', 10)
) as seed(name, sort_order)
where not exists (select 1 from public.toolkit_items);

insert into public.experience_entries (title, description, sort_order)
select title, description, sort_order
from (
  values
    ('Threat Detection and SIEM', 'Built detections, triaged alerts, enriched telemetry, and mapped findings to attacker behavior.', 1),
    ('Vulnerability Assessment', 'Documented exposure, prioritized remediation, and translated scan output into clear risk narratives.', 2),
    ('Cloud and Identity Security', 'Reviewed IAM, logging, network controls, and hardening baselines across modern cloud environments.', 3)
) as seed(title, description, sort_order)
where not exists (select 1 from public.experience_entries);

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read project files" on storage.objects;
create policy "Public can read project files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'project-files');

drop policy if exists "Admins can upload project files" on storage.objects;
create policy "Admins can upload project files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'project-files' and public.is_admin());

drop policy if exists "Admins can update project files" on storage.objects;
create policy "Admins can update project files"
on storage.objects
for update
to authenticated
using (bucket_id = 'project-files' and public.is_admin())
with check (bucket_id = 'project-files' and public.is_admin());

drop policy if exists "Admins can delete project files" on storage.objects;
create policy "Admins can delete project files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'project-files' and public.is_admin());
