-- Migration to support multi-tenant users
-- This allows users to be assigned to multiple tenants with different roles

-- Create user_tenant_roles table for many-to-many relationship between users and tenants
create table user_tenant_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  role text check (role in ('admin_tenant', 'doctor', 'patient', 'staff')) not null default 'patient',
  doctor_id uuid references doctors(id) on delete set null, -- For users with doctor role
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, tenant_id) -- One role per user per tenant
);

-- Add index for better query performance
create index idx_user_tenant_roles_user_id on user_tenant_roles(user_id);
create index idx_user_tenant_roles_tenant_id on user_tenant_roles(tenant_id);
create index idx_user_tenant_roles_role on user_tenant_roles(role);
create index idx_user_tenant_roles_active on user_tenant_roles(user_id, is_active);

-- Add current_tenant_id to user_profiles for active tenant selection
alter table user_profiles add column current_tenant_id uuid references tenants(id) on delete set null;

-- Add updated_at trigger for user_tenant_roles
create trigger update_user_tenant_roles_updated_at
  before update on user_tenant_roles
  for each row execute procedure update_updated_at_column();

-- Enable RLS on user_tenant_roles
alter table user_tenant_roles enable row level security;

-- RLS Policies for user_tenant_roles
create policy "Users can view their own tenant roles" on user_tenant_roles
  for select using (auth.uid() = user_id);

create policy "Admin tenants can view roles in their tenants" on user_tenant_roles
  for select using (
    exists (
      select 1 from user_tenant_roles utr
      where utr.user_id = auth.uid()
        and utr.tenant_id = user_tenant_roles.tenant_id
        and utr.role = 'admin_tenant'
        and utr.is_active = true
    )
  );

create policy "Users can insert their own tenant roles" on user_tenant_roles
  for insert with check (auth.uid() = user_id);

create policy "Admin tenants can manage roles in their tenants" on user_tenant_roles
  for all using (
    exists (
      select 1 from user_tenant_roles utr
      where utr.user_id = auth.uid()
        and utr.tenant_id = user_tenant_roles.tenant_id
        and utr.role = 'admin_tenant'
        and utr.is_active = true
    )
  );

-- Function to get user's active tenants
create or replace function get_user_tenants(user_uuid uuid default auth.uid())
returns table (
  tenant_id uuid,
  tenant_name text,
  tenant_type text,
  role text,
  is_current boolean
) as $$
begin
  return query
  select
    t.id as tenant_id,
    t.name as tenant_name,
    t.tenant_type::text as tenant_type,
    utr.role,
    (t.id = up.current_tenant_id) as is_current
  from user_tenant_roles utr
  join tenants t on t.id = utr.tenant_id
  left join user_profiles up on up.id = user_uuid
  where utr.user_id = user_uuid
    and utr.is_active = true
  order by is_current desc, t.name;
end;
$$ language plpgsql security definer;

-- Function to switch current tenant
create or replace function switch_current_tenant(tenant_uuid uuid)
returns boolean as $$
declare
  user_has_access boolean;
begin
  -- Check if user has access to this tenant
  select exists(
    select 1 from user_tenant_roles
    where user_id = auth.uid()
      and tenant_id = tenant_uuid
      and is_active = true
  ) into user_has_access;

  if not user_has_access then
    return false;
  end if;

  -- Update current tenant
  update user_profiles
  set current_tenant_id = tenant_uuid,
      updated_at = now()
  where id = auth.uid();

  return true;
end;
$$ language plpgsql security definer;

-- Function to add user to tenant with role
create or replace function add_user_to_tenant(
  user_uuid uuid,
  tenant_uuid uuid,
  user_role text default 'patient',
  doctor_uuid uuid default null
)
returns uuid as $$
declare
  role_id uuid;
begin
  -- Validate role
  if user_role not in ('admin_tenant', 'doctor', 'patient', 'staff') then
    raise exception 'Invalid role: %', user_role;
  end if;

  -- Insert or update user tenant role
  insert into user_tenant_roles (user_id, tenant_id, role, doctor_id)
  values (user_uuid, tenant_uuid, user_role, doctor_uuid)
  on conflict (user_id, tenant_id)
  do update set
    role = excluded.role,
    doctor_id = excluded.doctor_id,
    is_active = true,
    updated_at = now()
  returning id into role_id;

  -- If this is the user's first tenant, make it current
  update user_profiles
  set current_tenant_id = coalesce(current_tenant_id, tenant_uuid)
  where id = user_uuid;

  return role_id;
end;
$$ language plpgsql security definer;

-- Function to remove user from tenant
create or replace function remove_user_from_tenant(
  user_uuid uuid,
  tenant_uuid uuid
)
returns boolean as $$
begin
  -- Deactivate the role instead of deleting (for audit purposes)
  update user_tenant_roles
  set is_active = false,
      updated_at = now()
  where user_id = user_uuid
    and tenant_id = tenant_uuid;

  -- If this was the current tenant, switch to another active tenant
  update user_profiles
  set current_tenant_id = (
    select utr.tenant_id
    from user_tenant_roles utr
    where utr.user_id = user_uuid
      and utr.is_active = true
      and utr.tenant_id != tenant_uuid
    limit 1
  )
  where id = user_uuid
    and current_tenant_id = tenant_uuid;

  return true;
end;
$$ language plpgsql security definer;

-- Migrate existing user_profiles data to user_tenant_roles
-- This preserves existing single-tenant assignments
do $$
begin
  -- For each user with a tenant_id, create a user_tenant_role
  insert into user_tenant_roles (user_id, tenant_id, role, doctor_id)
  select
    up.id,
    up.tenant_id,
    up.role,
    up.doctor_id
  from user_profiles up
  where up.tenant_id is not null
  on conflict (user_id, tenant_id) do nothing;

  -- Set current_tenant_id to their existing tenant
  update user_profiles
  set current_tenant_id = tenant_id
  where tenant_id is not null
    and current_tenant_id is null;

end $$;

-- Add comments for documentation
comment on table user_tenant_roles is 'Many-to-many relationship between users and tenants with roles';
comment on column user_tenant_roles.role is 'User role within the tenant: admin_tenant, doctor, patient, staff';
comment on column user_tenant_roles.is_active is 'Whether this role assignment is currently active';
comment on column user_profiles.current_tenant_id is 'Currently selected tenant for multi-tenant users';

-- Create view for easy querying of user roles
create or replace view user_roles_view as
select
  up.id as user_id,
  up.email,
  up.first_name,
  up.last_name,
  utr.tenant_id,
  t.name as tenant_name,
  t.tenant_type,
  utr.role,
  utr.is_active,
  utr.doctor_id,
  d.first_name as doctor_first_name,
  d.last_name as doctor_last_name,
  (t.id = up.current_tenant_id) as is_current_tenant,
  utr.created_at as role_assigned_at
from user_profiles up
left join user_tenant_roles utr on utr.user_id = up.id
left join tenants t on t.id = utr.tenant_id
left join doctors d on d.id = utr.doctor_id
where utr.is_active = true or utr.is_active is null;

-- Grant necessary permissions
grant select on user_roles_view to authenticated;