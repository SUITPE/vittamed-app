-- VT-38: Appointment Lifecycle Management
-- Tracks all status changes with timestamps and audit trail

-- Create appointment lifecycle tracking table
create table appointment_status_history (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  status appointment_status not null,
  previous_status appointment_status,
  changed_by_user_id uuid, -- User who initiated the status change
  changed_by_role text, -- Role of the user who made the change
  reason text, -- Optional reason for the change
  notes text, -- Additional notes about the status change
  automated boolean default false, -- Whether this was an automated change
  change_source text default 'manual', -- 'manual', 'system', 'api', 'webhook'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index idx_appointment_status_history_appointment_id on appointment_status_history(appointment_id);
create index idx_appointment_status_history_tenant_id on appointment_status_history(tenant_id);
create index idx_appointment_status_history_status on appointment_status_history(status);
create index idx_appointment_status_history_created_at on appointment_status_history(created_at);
create index idx_appointment_status_history_changed_by on appointment_status_history(changed_by_user_id);

-- Create trigger function to automatically log status changes
create or replace function log_appointment_status_change()
returns trigger as $$
begin
  -- Only log if status actually changed
  if (old.status is distinct from new.status) then
    insert into appointment_status_history (
      appointment_id,
      tenant_id,
      status,
      previous_status,
      changed_by_user_id,
      changed_by_role,
      automated,
      change_source
    )
    values (
      new.id,
      new.tenant_id,
      new.status,
      old.status,
      auth.uid(), -- Current authenticated user
      (select role from user_profiles where id = auth.uid()),
      false, -- Manual change by default
      'api' -- Default source, can be overridden by application
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on appointments table
create trigger appointment_status_change_trigger
  after update on appointments
  for each row
  execute function log_appointment_status_change();

-- Also log initial status when appointment is created
create or replace function log_appointment_creation()
returns trigger as $$
begin
  insert into appointment_status_history (
    appointment_id,
    tenant_id,
    status,
    previous_status,
    changed_by_user_id,
    changed_by_role,
    automated,
    change_source,
    reason
  )
  values (
    new.id,
    new.tenant_id,
    new.status,
    null, -- No previous status for new appointments
    auth.uid(),
    (select role from user_profiles where id = auth.uid()),
    false,
    'api',
    'Initial appointment creation'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for appointment creation
create trigger appointment_creation_trigger
  after insert on appointments
  for each row
  execute function log_appointment_creation();

-- Row Level Security policies for appointment_status_history
alter table appointment_status_history enable row level security;

-- Allow all authenticated users to view status history within their tenant
create policy "Users can view appointment status history in their tenant"
  on appointment_status_history for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from user_profiles where id = auth.uid()
    )
  );

-- Allow creating status history records (triggers will handle this mostly)
create policy "System can create appointment status history"
  on appointment_status_history for insert
  to authenticated
  with check (
    tenant_id in (
      select tenant_id from user_profiles where id = auth.uid()
    )
  );

-- Prevent manual deletion/updates (audit trail must be immutable)
create policy "Status history is immutable"
  on appointment_status_history for update
  to authenticated
  using (false);

create policy "Status history cannot be deleted"
  on appointment_status_history for delete
  to authenticated
  using (false);

-- Add helpful comments
comment on table appointment_status_history is 'VT-38: Tracks all appointment status changes with timestamps and audit trail';
comment on column appointment_status_history.appointment_id is 'Reference to the appointment that changed status';
comment on column appointment_status_history.status is 'New status after the change';
comment on column appointment_status_history.previous_status is 'Previous status before the change (null for initial creation)';
comment on column appointment_status_history.changed_by_user_id is 'User who initiated the status change';
comment on column appointment_status_history.changed_by_role is 'Role of the user who made the change (admin_tenant, doctor, etc.)';
comment on column appointment_status_history.reason is 'Optional reason for the status change';
comment on column appointment_status_history.automated is 'Whether this was an automated system change';
comment on column appointment_status_history.change_source is 'Source of the change: manual, system, api, webhook';

-- Create view for easy status history queries
create or replace view appointment_lifecycle_view as
select
  ash.id as history_id,
  ash.appointment_id,
  ash.tenant_id,
  ash.status,
  ash.previous_status,
  ash.reason,
  ash.notes,
  ash.automated,
  ash.change_source,
  ash.created_at as status_changed_at,
  up.first_name as changed_by_first_name,
  up.last_name as changed_by_last_name,
  up.email as changed_by_email,
  ash.changed_by_role,
  -- Appointment details for context
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.total_amount,
  s.name as service_name,
  -- Patient details
  p.first_name as patient_first_name,
  p.last_name as patient_last_name,
  p.email as patient_email
from appointment_status_history ash
left join user_profiles up on ash.changed_by_user_id = up.id
left join appointments a on ash.appointment_id = a.id
left join services s on a.service_id = s.id
left join patients p on a.patient_id = p.id
order by ash.created_at desc;

-- Grant access to the view
grant select on appointment_lifecycle_view to authenticated;

-- Add RLS to the view (inherits from base tables)
alter view appointment_lifecycle_view set (security_invoker = true);