-- VT-43: Appointment Reminders System
-- Configurable reminder system with tenant branding support

-- Create reminder configurations table
create table reminder_configurations (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null,

  -- Configuration scope
  applies_to text not null check (applies_to in ('tenant_default', 'user_preference')), -- tenant_default or user_preference
  user_id uuid, -- null for tenant defaults, specific user for preferences

  -- Reminder settings
  email_enabled boolean default true,
  sms_enabled boolean default false,
  whatsapp_enabled boolean default false,

  -- Timing configuration (hours before appointment)
  email_hours_before integer default 24 check (email_hours_before >= 1 and email_hours_before <= 168), -- 1 hour to 1 week
  sms_hours_before integer default 2 check (sms_hours_before >= 1 and sms_hours_before <= 48), -- 1 hour to 2 days
  whatsapp_hours_before integer default 4 check (whatsapp_hours_before >= 1 and whatsapp_hours_before <= 48),

  -- Additional settings
  send_multiple_reminders boolean default false, -- Allow multiple reminders per appointment
  max_reminders integer default 1 check (max_reminders >= 1 and max_reminders <= 3),

  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Constraints
  unique(tenant_id, user_id), -- One configuration per user per tenant
  check (
    (applies_to = 'tenant_default' and user_id is null) or
    (applies_to = 'user_preference' and user_id is not null)
  )
);

-- Add indexes
create index idx_reminder_configurations_tenant_id on reminder_configurations(tenant_id);
create index idx_reminder_configurations_user_id on reminder_configurations(user_id);
create index idx_reminder_configurations_active on reminder_configurations(tenant_id, is_active);

-- Create scheduled reminders table for tracking what reminders need to be sent
create table scheduled_reminders (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  reminder_config_id uuid references reminder_configurations(id) on delete cascade,

  -- Reminder details
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  recipient text not null, -- email address or phone number
  scheduled_send_time timestamp with time zone not null,

  -- Processing status
  status text default 'scheduled' check (status in ('scheduled', 'processing', 'sent', 'failed', 'cancelled')),
  sent_at timestamp with time zone,
  error_message text,
  retry_count integer default 0,
  max_retries integer default 3,

  -- Content references
  notification_id uuid references notifications(id) on delete set null, -- Link to actual notification record

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for scheduled reminders
create index idx_scheduled_reminders_appointment_id on scheduled_reminders(appointment_id);
create index idx_scheduled_reminders_tenant_id on scheduled_reminders(tenant_id);
create index idx_scheduled_reminders_scheduled_time on scheduled_reminders(scheduled_send_time, status);
create index idx_scheduled_reminders_status on scheduled_reminders(status);
create index idx_scheduled_reminders_processing on scheduled_reminders(status, scheduled_send_time)
  where status in ('scheduled', 'processing');

-- Create tenant branding table for email customization
create table tenant_branding (
  id uuid default uuid_generate_v4() primary key,
  tenant_id uuid references tenants(id) on delete cascade not null unique,

  -- Brand identity
  logo_url text, -- URL to tenant logo
  primary_color text default '#2563eb', -- Brand primary color
  secondary_color text default '#f3f4f6', -- Brand secondary color

  -- Email customization
  email_from_name text, -- Custom sender name
  email_signature text, -- Custom email signature
  custom_footer text, -- Custom footer content

  -- SMS customization
  sms_sender_name text, -- Custom SMS sender identifier

  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for tenant branding
create index idx_tenant_branding_tenant_id on tenant_branding(tenant_id);

-- Add trigger for updated_at
create trigger update_reminder_configurations_updated_at
  before update on reminder_configurations
  for each row execute procedure update_updated_at_column();

create trigger update_scheduled_reminders_updated_at
  before update on scheduled_reminders
  for each row execute procedure update_updated_at_column();

create trigger update_tenant_branding_updated_at
  before update on tenant_branding
  for each row execute procedure update_updated_at_column();

-- Enable RLS
alter table reminder_configurations enable row level security;
alter table scheduled_reminders enable row level security;
alter table tenant_branding enable row level security;

-- RLS Policies for reminder_configurations
create policy "Users can view reminder configurations in their tenant"
  on reminder_configurations for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from user_profiles where id = auth.uid()
    )
  );

create policy "Admin tenants can manage reminder configurations"
  on reminder_configurations for all
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
        and tenant_id = reminder_configurations.tenant_id
        and role = 'admin_tenant'
        and is_active = true
    )
  );

create policy "Users can manage their own reminder preferences"
  on reminder_configurations for all
  to authenticated
  using (
    user_id = auth.uid() and applies_to = 'user_preference'
  );

-- RLS Policies for scheduled_reminders
create policy "Tenant members can view scheduled reminders"
  on scheduled_reminders for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from user_profiles where id = auth.uid()
    )
  );

create policy "System can manage scheduled reminders"
  on scheduled_reminders for all
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
        and tenant_id = scheduled_reminders.tenant_id
        and role in ('admin_tenant', 'staff')
    )
  );

-- RLS Policies for tenant_branding
create policy "Tenant members can view branding"
  on tenant_branding for select
  to authenticated
  using (
    tenant_id in (
      select tenant_id from user_profiles where id = auth.uid()
    )
  );

create policy "Admin tenants can manage branding"
  on tenant_branding for all
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
        and tenant_id = tenant_branding.tenant_id
        and role = 'admin_tenant'
        and is_active = true
    )
  );

-- Function to get effective reminder configuration for a user
create or replace function get_effective_reminder_config(user_id_param uuid, tenant_id_param uuid)
returns table (
  email_enabled boolean,
  sms_enabled boolean,
  whatsapp_enabled boolean,
  email_hours_before integer,
  sms_hours_before integer,
  whatsapp_hours_before integer,
  send_multiple_reminders boolean,
  max_reminders integer,
  config_source text
) as $$
declare
  user_config record;
  tenant_config record;
begin
  -- First, try to get user-specific configuration
  select * into user_config
  from reminder_configurations
  where user_id = user_id_param
    and tenant_id = tenant_id_param
    and applies_to = 'user_preference'
    and is_active = true;

  if found then
    -- Return user-specific configuration
    return query
    select
      user_config.email_enabled,
      user_config.sms_enabled,
      user_config.whatsapp_enabled,
      user_config.email_hours_before,
      user_config.sms_hours_before,
      user_config.whatsapp_hours_before,
      user_config.send_multiple_reminders,
      user_config.max_reminders,
      'user_preference'::text;
  else
    -- Fall back to tenant default
    select * into tenant_config
    from reminder_configurations
    where tenant_id = tenant_id_param
      and applies_to = 'tenant_default'
      and user_id is null
      and is_active = true;

    if found then
      return query
      select
        tenant_config.email_enabled,
        tenant_config.sms_enabled,
        tenant_config.whatsapp_enabled,
        tenant_config.email_hours_before,
        tenant_config.sms_hours_before,
        tenant_config.whatsapp_hours_before,
        tenant_config.send_multiple_reminders,
        tenant_config.max_reminders,
        'tenant_default'::text;
    else
      -- Return system defaults if no configuration exists
      return query
      select
        true::boolean,     -- email_enabled
        false::boolean,    -- sms_enabled
        false::boolean,    -- whatsapp_enabled
        24::integer,       -- email_hours_before
        2::integer,        -- sms_hours_before
        4::integer,        -- whatsapp_hours_before
        false::boolean,    -- send_multiple_reminders
        1::integer,        -- max_reminders
        'system_default'::text;
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- Function to schedule reminders for a new appointment
create or replace function schedule_appointment_reminders(appointment_id_param uuid)
returns integer as $$
declare
  apt record;
  config record;
  patient_user_id uuid;
  scheduled_count integer := 0;
begin
  -- Get appointment details
  select a.*, p.user_id into apt
  from appointments a
  left join patients p on a.patient_id = p.id
  where a.id = appointment_id_param;

  if not found then
    return 0;
  end if;

  -- Get patient's user_id (if patient has an account)
  patient_user_id := apt.user_id;

  -- Get effective reminder configuration
  select * into config
  from get_effective_reminder_config(patient_user_id, apt.tenant_id);

  -- Schedule email reminder
  if config.email_enabled then
    insert into scheduled_reminders (
      appointment_id,
      tenant_id,
      channel,
      recipient,
      scheduled_send_time
    )
    values (
      appointment_id_param,
      apt.tenant_id,
      'email',
      coalesce(
        (select email from user_profiles where id = patient_user_id),
        (select email from patients where id = apt.patient_id)
      ),
      (apt.appointment_date || ' ' || apt.start_time)::timestamp - (config.email_hours_before || ' hours')::interval
    )
    on conflict do nothing; -- Avoid duplicates

    if found then
      scheduled_count := scheduled_count + 1;
    end if;
  end if;

  -- Schedule SMS reminder
  if config.sms_enabled then
    insert into scheduled_reminders (
      appointment_id,
      tenant_id,
      channel,
      recipient,
      scheduled_send_time
    )
    values (
      appointment_id_param,
      apt.tenant_id,
      'sms',
      coalesce(
        (select phone from user_profiles where id = patient_user_id),
        (select phone from patients where id = apt.patient_id)
      ),
      (apt.appointment_date || ' ' || apt.start_time)::timestamp - (config.sms_hours_before || ' hours')::interval
    )
    on conflict do nothing;

    if found then
      scheduled_count := scheduled_count + 1;
    end if;
  end if;

  -- Schedule WhatsApp reminder
  if config.whatsapp_enabled then
    insert into scheduled_reminders (
      appointment_id,
      tenant_id,
      channel,
      recipient,
      scheduled_send_time
    )
    values (
      appointment_id_param,
      apt.tenant_id,
      'whatsapp',
      coalesce(
        (select phone from user_profiles where id = patient_user_id),
        (select phone from patients where id = apt.patient_id)
      ),
      (apt.appointment_date || ' ' || apt.start_time)::timestamp - (config.whatsapp_hours_before || ' hours')::interval
    )
    on conflict do nothing;

    if found then
      scheduled_count := scheduled_count + 1;
    end if;
  end if;

  return scheduled_count;
end;
$$ language plpgsql security definer;

-- Trigger to automatically schedule reminders when appointment is created
create or replace function auto_schedule_appointment_reminders()
returns trigger as $$
begin
  -- Only schedule reminders for confirmed appointments
  if new.status in ('pending', 'confirmed') then
    perform schedule_appointment_reminders(new.id);
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger for new appointments
create trigger trigger_auto_schedule_reminders
  after insert on appointments
  for each row
  execute function auto_schedule_appointment_reminders();

-- Create default tenant reminder configurations for existing tenants
insert into reminder_configurations (tenant_id, applies_to, email_enabled, email_hours_before, sms_enabled, sms_hours_before)
select
  id as tenant_id,
  'tenant_default'::text,
  true, -- email enabled by default
  24, -- 24 hours before
  false, -- SMS disabled by default (requires configuration)
  2 -- 2 hours before
from tenants
on conflict do nothing;

-- Add helpful comments
comment on table reminder_configurations is 'VT-43: Configurable reminder settings for tenants and users';
comment on table scheduled_reminders is 'VT-43: Tracks scheduled reminders that need to be sent';
comment on table tenant_branding is 'VT-43: Tenant-specific branding for notifications';
comment on function get_effective_reminder_config(uuid, uuid) is 'VT-43: Gets effective reminder configuration with fallback to tenant defaults';
comment on function schedule_appointment_reminders(uuid) is 'VT-43: Schedules reminders for a new appointment based on configuration';