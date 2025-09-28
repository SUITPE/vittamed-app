-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create tenant types enum
create type tenant_type as enum ('clinic', 'spa', 'consultorio');

-- Create tenants table
create table tenants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  tenant_type tenant_type not null,
  address text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create doctors table
create table doctors (
  id uuid default uuid_generate_v4() primary key,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  specialty text,
  license_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create doctor_tenants table (many-to-many relationship)
create table doctor_tenants (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references doctors(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  is_active boolean default true,
  hourly_rate decimal(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(doctor_id, tenant_id)
);

-- Create patients table
create table patients (
  id uuid default uuid_generate_v4() primary key,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create services table
create table services (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes integer not null default 60,
  price decimal(10,2),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create appointment status enum
create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- Create appointments table
create table appointments (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,
  doctor_id uuid references doctors(id) on delete cascade not null,
  patient_id uuid references patients(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status default 'pending',
  notes text,
  total_amount decimal(10,2),
  paid_amount decimal(10,2) default 0,
  payment_status text default 'pending',
  stripe_payment_intent_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create doctor availability table
create table doctor_availability (
  id uuid default uuid_generate_v4() primary key,
  doctor_tenant_id uuid references doctor_tenants(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(doctor_tenant_id, day_of_week, start_time)
);

-- Create doctor breaks table (for lunch breaks, etc.)
create table doctor_breaks (
  id uuid default uuid_generate_v4() primary key,
  doctor_tenant_id uuid references doctor_tenants(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  break_type text default 'break',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id) on delete cascade not null,
  type text not null, -- 'confirmation', 'reminder', 'cancellation'
  channel text not null, -- 'email', 'whatsapp', 'sms'
  recipient text not null,
  message text not null,
  sent_at timestamp with time zone,
  status text default 'pending', -- 'pending', 'sent', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_appointments_tenant_id on appointments(tenant_id);
create index idx_appointments_doctor_id on appointments(doctor_id);
create index idx_appointments_patient_id on appointments(patient_id);
create index idx_appointments_date on appointments(appointment_date);
create index idx_appointments_status on appointments(status);
create index idx_doctor_tenants_doctor_id on doctor_tenants(doctor_id);
create index idx_doctor_tenants_tenant_id on doctor_tenants(tenant_id);
create index idx_doctor_availability_doctor_tenant_id on doctor_availability(doctor_tenant_id);
create index idx_services_tenant_id on services(tenant_id);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_tenants_updated_at before update on tenants
  for each row execute procedure update_updated_at_column();

create trigger update_doctors_updated_at before update on doctors
  for each row execute procedure update_updated_at_column();

create trigger update_patients_updated_at before update on patients
  for each row execute procedure update_updated_at_column();

create trigger update_services_updated_at before update on services
  for each row execute procedure update_updated_at_column();

create trigger update_appointments_updated_at before update on appointments
  for each row execute procedure update_updated_at_column();