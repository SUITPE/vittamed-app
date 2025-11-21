-- =====================================================
-- VITTASAMI - BASE SCHEMA (TABLAS PRINCIPALES)
-- =====================================================
-- Este script crea todas las tablas base del sistema
-- Debe ejecutarse ANTES de las migraciones incrementales
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TENANTS (Multi-tenant core)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  tenant_type text NOT NULL CHECK (tenant_type IN ('clinic', 'spa', 'consultorio', 'hospital', 'other')),
  address text,
  phone text,
  email text,
  logo_url text,
  website text,
  timezone text DEFAULT 'America/Lima',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. PROFILES (User profiles linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin_tenant', 'doctor', 'receptionist', 'patient')),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 3. DOCTORS
-- =====================================================
CREATE TABLE IF NOT EXISTS doctors (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  specialty text,
  license_number text UNIQUE,
  bio text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 4. DOCTOR_TENANTS (Many-to-many: doctors can work in multiple tenants)
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_tenants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hourly_rate numeric(10, 2),
  commission_rate numeric(5, 2),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(doctor_id, tenant_id)
);

-- =====================================================
-- 5. DOCTOR_AVAILABILITY (Weekly schedule)
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_tenant_id uuid NOT NULL REFERENCES doctor_tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- =====================================================
-- 6. DOCTOR_BREAKS (Lunch, coffee breaks, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS doctor_breaks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doctor_tenant_id uuid NOT NULL REFERENCES doctor_tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_type text NOT NULL CHECK (break_type IN ('lunch', 'coffee', 'other')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_break_time CHECK (start_time < end_time)
);

-- =====================================================
-- 7. PATIENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  gender text CHECK (gender IN ('M', 'F', 'Other', 'Prefer not to say')),
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'PE',
  emergency_contact_name text,
  emergency_contact_phone text,
  blood_type text,
  allergies text[],
  chronic_conditions text[],
  current_medications text[],
  insurance_provider text,
  insurance_number text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 8. SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 9. APPOINTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  cancellation_reason text,
  cancelled_at timestamp with time zone,
  cancelled_by uuid REFERENCES auth.users(id),
  total_amount numeric(10, 2) DEFAULT 0,
  paid_amount numeric(10, 2) DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
  payment_method text CHECK (payment_method IN ('cash', 'card', 'transfer', 'insurance', 'other')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Doctors
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);

-- Doctor Tenants
CREATE INDEX IF NOT EXISTS idx_doctor_tenants_doctor_id ON doctor_tenants(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_tenants_tenant_id ON doctor_tenants(tenant_id);

-- Doctor Availability
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_tenant_id ON doctor_availability(doctor_tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(day_of_week);

-- Doctor Breaks
CREATE INDEX IF NOT EXISTS idx_doctor_breaks_doctor_tenant_id ON doctor_breaks(doctor_tenant_id);

-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Super Admin has full access
CREATE POLICY "Super admins have full access to tenants" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins have full access to profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- RLS Policies: Tenant isolation
CREATE POLICY "Users can view their tenant" ON tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can view profiles in their tenant" ON profiles
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Doctors: Can view themselves and doctors in their tenants
CREATE POLICY "Doctors can view themselves" ON doctors
  FOR SELECT USING (
    email IN (
      SELECT email FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Services: Tenant isolation
CREATE POLICY "Users can view services in their tenant" ON services
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Appointments: Tenant isolation
CREATE POLICY "Users can view appointments in their tenant" ON appointments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Patients: Tenant-level access (appointments link them to tenants)
CREATE POLICY "Users can view patients with appointments in their tenant" ON patients
  FOR SELECT USING (
    id IN (
      SELECT patient_id FROM appointments
      WHERE tenant_id IN (
        SELECT tenant_id FROM profiles
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_tenants_updated_at BEFORE UPDATE ON doctor_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_availability_updated_at BEFORE UPDATE ON doctor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_breaks_updated_at BEFORE UPDATE ON doctor_breaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE tenants IS 'Multi-tenant organizations (clinics, spas, consultorios)';
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users with role-based access';
COMMENT ON TABLE doctors IS 'Medical professionals who can work in multiple tenants';
COMMENT ON TABLE doctor_tenants IS 'Association table linking doctors to tenants with specific rates';
COMMENT ON TABLE doctor_availability IS 'Weekly recurring availability schedule for doctors';
COMMENT ON TABLE doctor_breaks IS 'Break times within doctor availability (lunch, coffee breaks)';
COMMENT ON TABLE patients IS 'Patients receiving medical services';
COMMENT ON TABLE services IS 'Services offered by each tenant (consultations, treatments, etc.)';
COMMENT ON TABLE appointments IS 'Scheduled appointments between patients and doctors';
