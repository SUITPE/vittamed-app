-- Add user roles and profiles

-- Create user profiles table that extends Supabase auth.users
create table user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  first_name text,
  last_name text,
  role text check (role in ('admin_tenant', 'doctor', 'patient')) not null default 'patient',
  tenant_id uuid references tenants(id) on delete set null,
  doctor_id uuid references doctors(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to automatically create profile when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to call the function when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Add RLS (Row Level Security) policies

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table doctors enable row level security;
alter table doctor_tenants enable row level security;
alter table patients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table doctor_availability enable row level security;
alter table doctor_breaks enable row level security;
alter table notifications enable row level security;
alter table user_profiles enable row level security;

-- User profiles policies
create policy "Users can view their own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on user_profiles
  for update using (auth.uid() = id);

-- Tenants policies
create policy "Admin tenants can view their tenant" on tenants
  for select using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and role = 'admin_tenant'
      and tenant_id = tenants.id
    )
  );

create policy "Doctors can view tenants they work for" on tenants
  for select using (
    exists (
      select 1 from user_profiles up
      join doctor_tenants dt on dt.doctor_id = up.doctor_id
      where up.id = auth.uid()
      and dt.tenant_id = tenants.id
    )
  );

create policy "Anyone can view tenants for booking" on tenants
  for select using (true);

-- Services policies
create policy "Services are viewable by tenant members and public" on services
  for select using (true);

create policy "Only tenant admins can manage services" on services
  for all using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and role = 'admin_tenant'
      and tenant_id = services.tenant_id
    )
  );

-- Doctors policies
create policy "Doctors are publicly viewable" on doctors
  for select using (true);

create policy "Doctors can update their own profile" on doctors
  for update using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and doctor_id = doctors.id
    )
  );

-- Appointments policies
create policy "Patients can view their own appointments" on appointments
  for select using (
    exists (
      select 1 from patients p
      join user_profiles up on up.email = p.email
      where up.id = auth.uid()
      and p.id = appointments.patient_id
    )
  );

create policy "Doctors can view appointments for their tenants" on appointments
  for select using (
    exists (
      select 1 from user_profiles up
      join doctor_tenants dt on dt.doctor_id = up.doctor_id
      where up.id = auth.uid()
      and dt.tenant_id = appointments.tenant_id
      and appointments.doctor_id = up.doctor_id
    )
  );

create policy "Tenant admins can view all tenant appointments" on appointments
  for select using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and role = 'admin_tenant'
      and tenant_id = appointments.tenant_id
    )
  );

create policy "Anyone can create appointments" on appointments
  for insert with check (true);

create policy "Patients can update their own appointments" on appointments
  for update using (
    exists (
      select 1 from patients p
      join user_profiles up on up.email = p.email
      where up.id = auth.uid()
      and p.id = appointments.patient_id
    )
  );

-- Doctor availability policies
create policy "Availability is publicly viewable" on doctor_availability
  for select using (true);

create policy "Doctors can manage their own availability" on doctor_availability
  for all using (
    exists (
      select 1 from user_profiles up
      join doctor_tenants dt on dt.doctor_id = up.doctor_id
      where up.id = auth.uid()
      and dt.id = doctor_availability.doctor_tenant_id
    )
  );

-- Similar policies for doctor_breaks
create policy "Breaks are publicly viewable" on doctor_breaks
  for select using (true);

create policy "Doctors can manage their own breaks" on doctor_breaks
  for all using (
    exists (
      select 1 from user_profiles up
      join doctor_tenants dt on dt.doctor_id = up.doctor_id
      where up.id = auth.uid()
      and dt.id = doctor_breaks.doctor_tenant_id
    )
  );

-- Add updated_at trigger for user_profiles
create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute procedure update_updated_at_column();

-- Create some default admin users for testing
-- Note: These would be created through the auth system in real implementation
-- This is just for seeding demo data