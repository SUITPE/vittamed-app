-- Add tenant_id to patients table
alter table patients
add column tenant_id uuid references tenants(id) on delete cascade;

-- Add index for better query performance
create index idx_patients_tenant_id on patients(tenant_id);

-- Add is_active column if it doesn't exist
alter table patients
add column if not exists is_active boolean default true;

-- Add medical_history column if it doesn't exist
alter table patients
add column if not exists medical_history text;

-- Update existing patients to have a tenant_id based on their appointments
-- This is a data migration - assign patients to the tenant of their first appointment
update patients p
set tenant_id = (
  select a.tenant_id
  from appointments a
  where a.patient_id = p.id
  order by a.created_at asc
  limit 1
)
where p.tenant_id is null;
