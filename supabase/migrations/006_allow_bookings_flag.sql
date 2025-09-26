-- VT-40: Allow Bookings Flag for Members
-- Adds admin control over which members can receive bookings

-- Add allow_bookings flag to user_profiles for members
alter table user_profiles
add column allow_bookings boolean default true;

-- Add comment for documentation
comment on column user_profiles.allow_bookings is 'VT-40: Controls whether a member can receive bookings (only relevant for role=member)';

-- Create index for performance when filtering members available for booking
create index idx_user_profiles_allow_bookings_member
on user_profiles(allow_bookings)
where role = 'member';

-- Add composite index for efficient member booking queries
create index idx_user_profiles_member_bookings
on user_profiles(tenant_id, role, allow_bookings, is_active)
where role = 'member';

-- Update RLS policies to include allow_bookings in member visibility

-- Create function to check if a member allows bookings
create or replace function member_allows_bookings(member_user_id uuid)
returns boolean as $$
declare
  allows_bookings boolean;
begin
  select allow_bookings into allows_bookings
  from user_profiles
  where id = member_user_id and role = 'member' and is_active = true;

  return coalesce(allows_bookings, false);
end;
$$ language plpgsql security definer;

-- Add comment for function
comment on function member_allows_bookings(uuid) is 'VT-40: Returns true if member allows bookings, false otherwise';

-- Create function to get members available for booking (includes service association + allow_bookings check)
create or replace function get_bookable_members_for_service(service_id_param uuid, tenant_id_param uuid)
returns table (
  member_user_id uuid,
  first_name text,
  last_name text,
  email text,
  allow_bookings boolean,
  is_active boolean,
  member_service_active boolean
) as $$
begin
  return query
  select
    up.id as member_user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.allow_bookings,
    up.is_active,
    ms.is_active as member_service_active
  from user_profiles up
  inner join member_services ms on ms.member_user_id = up.id
  where up.role = 'member'
    and up.tenant_id = tenant_id_param
    and up.is_active = true
    and up.allow_bookings = true  -- VT-40: Only members who allow bookings
    and ms.service_id = service_id_param
    and ms.tenant_id = tenant_id_param
    and ms.is_active = true
  order by up.first_name, up.last_name;
end;
$$ language plpgsql security definer;

-- Add comment for function
comment on function get_bookable_members_for_service(uuid, uuid) is 'VT-40: Returns members available for booking for a specific service, filtering by allow_bookings flag';

-- Create view for admin management of member booking settings
create or replace view member_booking_settings as
select
  up.id as member_user_id,
  up.tenant_id,
  up.first_name,
  up.last_name,
  up.email,
  up.allow_bookings,
  up.is_active,
  up.created_at,
  up.updated_at,
  -- Count of services assigned to this member
  (
    select count(*)
    from member_services ms
    where ms.member_user_id = up.id
      and ms.tenant_id = up.tenant_id
      and ms.is_active = true
  ) as assigned_services_count,
  -- Count of availability entries
  (
    select count(*)
    from member_availability ma
    where ma.member_user_id = up.id
      and ma.tenant_id = up.tenant_id
      and ma.is_active = true
  ) as availability_entries_count
from user_profiles up
where up.role = 'member'
  and up.is_active = true
order by up.tenant_id, up.first_name, up.last_name;

-- Add RLS for the view
alter view member_booking_settings set (security_invoker = true);

-- Grant access to authenticated users (RLS will filter by tenant)
grant select on member_booking_settings to authenticated;

-- Add RLS policy for member_booking_settings access
-- Admin tenants can view/manage all members in their tenant
-- Members can view their own settings
create policy "Member booking settings access"
  on user_profiles for select
  using (
    role = 'member' and (
      -- Members can view their own settings
      auth.uid() = id
      or
      -- Admin tenants can view members in their tenant
      exists (
        select 1 from user_profiles admin
        where admin.id = auth.uid()
          and admin.tenant_id = user_profiles.tenant_id
          and admin.role = 'admin_tenant'
          and admin.is_active = true
      )
      or
      -- Doctors and staff can view members in their tenant (for scheduling)
      exists (
        select 1 from user_profiles staff
        where staff.id = auth.uid()
          and staff.tenant_id = user_profiles.tenant_id
          and staff.role in ('doctor', 'staff')
          and staff.is_active = true
      )
    )
  );

-- Add RLS policy for updating allow_bookings
-- Only admin tenants can update allow_bookings flag
create policy "Admin can update member allow_bookings"
  on user_profiles for update
  using (
    role = 'member' and
    exists (
      select 1 from user_profiles admin
      where admin.id = auth.uid()
        and admin.tenant_id = user_profiles.tenant_id
        and admin.role = 'admin_tenant'
        and admin.is_active = true
    )
  )
  with check (
    role = 'member' and
    exists (
      select 1 from user_profiles admin
      where admin.id = auth.uid()
        and admin.tenant_id = user_profiles.tenant_id
        and admin.role = 'admin_tenant'
        and admin.is_active = true
    )
  );

-- Update existing member_services policies to respect allow_bookings flag
-- This ensures that services can only be assigned to members who allow bookings
-- (Note: We could enforce this, but it's better to allow flexibility -
-- admin might want to prepare services for a member before enabling bookings)

-- Create trigger to log changes to allow_bookings flag
create or replace function log_member_booking_settings_change()
returns trigger as $$
begin
  -- Only log if allow_bookings changed and it's a member
  if (old.allow_bookings is distinct from new.allow_bookings) and new.role = 'member' then
    insert into appointment_status_history (
      appointment_id,
      tenant_id,
      status,
      previous_status,
      changed_by_user_id,
      changed_by_role,
      reason,
      automated,
      change_source
    )
    select
      null, -- No specific appointment
      new.tenant_id,
      case when new.allow_bookings then 'confirmed' else 'cancelled' end, -- Use existing enum
      case when old.allow_bookings then 'confirmed' else 'cancelled' end,
      auth.uid(),
      (select role from user_profiles where id = auth.uid()),
      concat('Member booking settings changed: allow_bookings = ', new.allow_bookings::text),
      false,
      'api'
    where false; -- Disabled for now - we might want a separate audit table for this
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- We're not creating the trigger yet - it's complex to log member setting changes
-- in the appointment history table. We'll handle logging at the API level instead.

-- Set default allow_bookings = true for existing members
update user_profiles
set allow_bookings = true
where role = 'member' and allow_bookings is null;

-- Create helpful indexes for booking-related queries
create index idx_member_services_booking_enabled
on member_services(service_id, tenant_id, is_active, member_user_id)
where is_active = true;

create index idx_member_availability_booking_enabled
on member_availability(member_user_id, tenant_id, day_of_week, is_active)
where is_active = true;