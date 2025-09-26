-- Seed data for VittaMed

-- Insert demo tenants
insert into tenants (id, name, tenant_type, address, phone, email) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Clínica San Rafael', 'clinic', 'Av. Principal 123, Ciudad', '+1234567890', 'contacto@clinicasanrafael.com'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Spa Wellness Center', 'spa', 'Calle Relajación 456, Ciudad', '+1234567891', 'info@spawellness.com'),
  ('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Consultorio Dr. García', 'consultorio', 'Av. Médica 789, Ciudad', '+1234567892', 'drgarcia@consultorio.com');

-- Insert demo doctors
insert into doctors (id, first_name, last_name, email, phone, specialty, license_number) values
  ('550e8400-e29b-41d4-a716-446655440001', 'Ana', 'Rodríguez', 'ana.rodriguez@email.com', '+1234567801', 'Cardiología', 'MED-001'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Carlos', 'López', 'carlos.lopez@email.com', '+1234567802', 'Dermatología', 'MED-002'),
  ('550e8400-e29b-41d4-a716-446655440003', 'María', 'González', 'maria.gonzalez@email.com', '+1234567803', 'Ginecología', 'MED-003'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Pedro', 'Martínez', 'pedro.martinez@email.com', '+1234567804', 'Medicina General', 'MED-004');

-- Link doctors to tenants
insert into doctor_tenants (doctor_id, tenant_id, hourly_rate) values
  ('550e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 150.00), -- Ana en Clínica San Rafael
  ('550e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 120.00), -- Carlos en Clínica San Rafael
  ('550e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 140.00), -- María en Clínica San Rafael
  ('550e8400-e29b-41d4-a716-446655440004', '6ba7b811-9dad-11d1-80b4-00c04fd430c8', 100.00), -- Pedro en Consultorio Dr. García
  ('550e8400-e29b-41d4-a716-446655440002', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 80.00);   -- Carlos también en Spa

-- Insert demo patients
insert into patients (id, first_name, last_name, email, phone, date_of_birth, gender, address) values
  ('123e4567-e89b-12d3-a456-426614174000', 'Laura', 'Fernández', 'laura.fernandez@email.com', '+1234567901', '1985-03-15', 'F', 'Calle Paciente 123'),
  ('123e4567-e89b-12d3-a456-426614174001', 'Roberto', 'Silva', 'roberto.silva@email.com', '+1234567902', '1978-07-22', 'M', 'Av. Salud 456'),
  ('123e4567-e89b-12d3-a456-426614174002', 'Carmen', 'Torres', 'carmen.torres@email.com', '+1234567903', '1992-11-08', 'F', 'Plaza Bienestar 789');

-- Insert demo services
insert into services (tenant_id, name, description, duration_minutes, price) values
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Consulta Cardiología', 'Consulta especializada en cardiología', 45, 150.00),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Consulta Dermatología', 'Evaluación dermatológica completa', 30, 120.00),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Consulta Ginecología', 'Consulta ginecológica', 45, 140.00),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Masaje Relajante', 'Masaje corporal completo', 60, 80.00),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Tratamiento Facial', 'Limpieza facial profunda', 90, 100.00),
  ('6ba7b811-9dad-11d1-80b4-00c04fd430c8', 'Consulta Medicina General', 'Consulta médica general', 30, 60.00);

-- Insert doctor availability (Monday to Friday, 9 AM to 5 PM)
with doctor_tenant_ids as (
  select id, doctor_id from doctor_tenants
)
insert into doctor_availability (doctor_tenant_id, day_of_week, start_time, end_time)
select
  dt.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00'::time as start_time,
  '17:00'::time as end_time
from doctor_tenant_ids dt;

-- Insert lunch breaks (12:00 PM to 1:00 PM)
with doctor_tenant_ids as (
  select id from doctor_tenants
)
insert into doctor_breaks (doctor_tenant_id, day_of_week, start_time, end_time, break_type)
select
  dt.id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '12:00'::time as start_time,
  '13:00'::time as end_time,
  'lunch' as break_type
from doctor_tenant_ids dt;

-- Insert some demo appointments for next week
with next_monday as (
  select date_trunc('week', current_date) + interval '1 week' as date
)
insert into appointments (
  tenant_id,
  doctor_id,
  patient_id,
  service_id,
  appointment_date,
  start_time,
  end_time,
  status,
  total_amount,
  paid_amount,
  payment_status
) values
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '550e8400-e29b-41d4-a716-446655440001',
    '123e4567-e89b-12d3-a456-426614174000',
    (select id from services where name = 'Consulta Cardiología' limit 1),
    (select date from next_monday),
    '10:00'::time,
    '10:45'::time,
    'confirmed',
    150.00,
    150.00,
    'completed'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '550e8400-e29b-41d4-a716-446655440002',
    '123e4567-e89b-12d3-a456-426614174001',
    (select id from services where name = 'Consulta Dermatología' limit 1),
    (select date from next_monday) + interval '1 day',
    '14:00'::time,
    '14:30'::time,
    'pending',
    120.00,
    60.00,
    'partial'
  );