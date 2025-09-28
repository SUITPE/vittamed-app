-- Migration: Associate services with members (VT-36)
-- Create table to associate members with services they can provide

-- Create member_services table
create table member_services (
  id uuid default gen_random_uuid() primary key,
  member_user_id uuid not null, -- References user_profiles.id where role='member'
  service_id uuid references services(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure a member can't be assigned to the same service twice in the same tenant
  unique(member_user_id, service_id, tenant_id)
);

-- Add foreign key constraint to user_profiles (checking role='member' will be done at application level)
-- Note: We can't add a FK to user_profiles directly since it's in auth schema
-- We'll add check constraints and handle validation in the application

-- Add indexes for performance
create index idx_member_services_member_user_id on member_services(member_user_id);
create index idx_member_services_service_id on member_services(service_id);
create index idx_member_services_tenant_id on member_services(tenant_id);
create index idx_member_services_active on member_services(is_active) where is_active = true;

-- Add trigger for updated_at
create trigger update_member_services_updated_at before update on member_services
  for each row execute procedure update_updated_at_column();

-- Enable RLS
alter table member_services enable row level security;

-- RLS Policies for member_services

-- Admins and receptionists can view all member services in their tenant
create policy "Admins and receptionists can view member services in their tenant" on member_services
  for select using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_services.tenant_id
      and up.role in ('admin_tenant', 'receptionist')
    )
  );

-- Members can view their own service assignments
create policy "Members can view their own service assignments" on member_services
  for select using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.id = member_services.member_user_id
      and up.role = 'member'
    )
  );

-- Doctors can view member services in their tenant (for booking purposes)
create policy "Doctors can view member services in their tenant" on member_services
  for select using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_services.tenant_id
      and up.role = 'doctor'
    )
  );

-- Public can view active member services (for booking)
create policy "Public can view active member services" on member_services
  for select using (is_active = true);

-- Admins and receptionists can insert member services in their tenant
create policy "Admins and receptionists can insert member services" on member_services
  for insert with check (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_services.tenant_id
      and up.role in ('admin_tenant', 'receptionist')
    )
  );

-- Admins and receptionists can update member services in their tenant
create policy "Admins and receptionists can update member services" on member_services
  for update using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_services.tenant_id
      and up.role in ('admin_tenant', 'receptionist')
    )
  );

-- Only admins can delete member services
create policy "Only admins can delete member services" on member_services
  for delete using (
    exists (
      select 1 from user_profiles up
      where up.id = auth.uid()
      and up.tenant_id = member_services.tenant_id
      and up.role = 'admin_tenant'
    )
  );

-- Add member_id field to appointments table to track which member provided the service
-- This is optional but useful for tracking who actually provided the service
alter table appointments add column member_id uuid;
alter table appointments add column assigned_member_id uuid; -- Member assigned to provide this service

-- Add indexes for the new appointment fields
create index idx_appointments_member_id on appointments(member_id);
create index idx_appointments_assigned_member_id on appointments(assigned_member_id);

-- Add comments for documentation
comment on table member_services is 'Associates members with services they can provide';
comment on column member_services.member_user_id is 'ID of the user with role=member who can provide this service';
comment on column member_services.service_id is 'ID of the service that the member can provide';
comment on column member_services.tenant_id is 'Tenant where this member-service association exists';
comment on column member_services.is_active is 'Whether this member-service association is currently active';

comment on column appointments.member_id is 'ID of the member who actually provided the service (for completed appointments)';
comment on column appointments.assigned_member_id is 'ID of the member assigned to provide this service';