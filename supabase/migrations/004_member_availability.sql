-- VT-18: Member Availability System
-- This migration creates the availability system for members, mirroring the doctor availability structure

-- Create member_availability table
create table member_availability (
  id uuid default gen_random_uuid() primary key,
  member_user_id uuid not null, -- References user_profiles with role='member'
  tenant_id uuid references tenants(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  unique(member_user_id, tenant_id, day_of_week, start_time),
  check (start_time < end_time)
);

-- Create member_breaks table (optional breaks during availability periods)
create table member_breaks (
  id uuid default gen_random_uuid() primary key,
  member_user_id uuid not null, -- References user_profiles with role='member'
  tenant_id uuid references tenants(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  break_type varchar(50) default 'lunch', -- 'lunch', 'break', 'other'
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  unique(member_user_id, tenant_id, day_of_week, start_time),
  check (start_time < end_time)
);

-- Create indexes for performance
create index idx_member_availability_member_tenant on member_availability(member_user_id, tenant_id);
create index idx_member_availability_day on member_availability(day_of_week);
create index idx_member_breaks_member_tenant on member_breaks(member_user_id, tenant_id);
create index idx_member_breaks_day on member_breaks(day_of_week);

-- Enable Row Level Security (RLS)
alter table member_availability enable row level security;
alter table member_breaks enable row level security;

-- RLS Policies for member_availability
create policy "Public can view active member availability"
  on member_availability for select
  using (is_active = true);

create policy "Members can manage their own availability"
  on member_availability for all
  using (
    auth.uid()::text = member_user_id
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.role = 'member'
    )
  );

create policy "Admins and receptionists can manage member availability in their tenant"
  on member_availability for all
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_availability.tenant_id
      and up.role in ('admin_tenant', 'receptionist')
    )
  );

-- RLS Policies for member_breaks
create policy "Public can view active member breaks"
  on member_breaks for select
  using (is_active = true);

create policy "Members can manage their own breaks"
  on member_breaks for all
  using (
    auth.uid()::text = member_user_id
    and exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.role = 'member'
    )
  );

create policy "Admins and receptionists can manage member breaks in their tenant"
  on member_breaks for all
  using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_breaks.tenant_id
      and up.role in ('admin_tenant', 'receptionist')
    )
  );

-- Add foreign key constraints (done after RLS to avoid conflicts)
alter table member_availability add constraint fk_member_availability_user
  foreign key (member_user_id) references auth.users(id) on delete cascade;

alter table member_breaks add constraint fk_member_breaks_user
  foreign key (member_user_id) references auth.users(id) on delete cascade;

-- Create function to validate member exists and has member role
create or replace function validate_member_role(user_id uuid, tenant_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from user_profiles up
    where up.id = user_id
    and up.tenant_id = tenant_id
    and up.role = 'member'
  );
end;
$$ language plpgsql security definer;

-- Add trigger to validate member role on insert/update
create or replace function check_member_availability_role()
returns trigger as $$
begin
  if not validate_member_role(new.member_user_id::uuid, new.tenant_id) then
    raise exception 'User must be a member in the specified tenant';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tr_check_member_availability_role
  before insert or update on member_availability
  for each row execute function check_member_availability_role();

create trigger tr_check_member_breaks_role
  before insert or update on member_breaks
  for each row execute function check_member_availability_role();

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_member_availability_updated_at
  before update on member_availability
  for each row execute function update_updated_at_column();

create trigger tr_member_breaks_updated_at
  before update on member_breaks
  for each row execute function update_updated_at_column();