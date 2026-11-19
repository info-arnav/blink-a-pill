CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT,
  pack TEXT,
  form TEXT,
  discontinued BOOLEAN NOT NULL DEFAULT FALSE,
  composition TEXT NOT NULL,
  search_name TEXT NOT NULL
);

CREATE INDEX products_search_trgm ON products USING gin (search_name gin_trgm_ops);

CREATE TABLE product_ingredients (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
  strength_value NUMERIC,
  strength_unit TEXT,
  strength_text TEXT,
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX product_ingredients_ingredient ON product_ingredients (ingredient_id);

CREATE TABLE ingredient_interactions (
  a_id INTEGER NOT NULL REFERENCES ingredients(id),
  b_id INTEGER NOT NULL REFERENCES ingredients(id),
  severity TEXT NOT NULL,
  PRIMARY KEY (a_id, b_id),
  CHECK (a_id < b_id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  whatsapp_consent_at TIMESTAMPTZ,
  sharing_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'pharmacy')),
  subject_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
  phone TEXT NOT NULL,
  abha_address TEXT,
  weight_kg NUMERIC,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patient_members (
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('self', 'caregiver')),
  relation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (patient_id, user_id)
);

CREATE TABLE caregiver_invites (
  code TEXT PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  relation TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ
);

CREATE TABLE prescribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  speciality TEXT,
  registration_number TEXT,
  registration_council TEXT,
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reception_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  display_name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  dose_amount NUMERIC NOT NULL DEFAULT 1,
  dose_unit TEXT NOT NULL DEFAULT 'tablet',
  frequency TEXT NOT NULL,
  times TEXT[] NOT NULL,
  meal TEXT NOT NULL DEFAULT 'any' CHECK (meal IN ('before', 'after', 'with', 'any')),
  start_date DATE NOT NULL,
  duration_days INTEGER,
  end_date DATE,
  is_antibiotic BOOLEAN NOT NULL DEFAULT FALSE,
  prescriber_id UUID REFERENCES prescribers(id),
  clinic_id UUID REFERENCES clinics(id),
  prescribed_on DATE,
  source TEXT NOT NULL CHECK (source IN ('photo', 'manual', 'abha')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'completed')),
  status_reason TEXT,
  course_outcome TEXT CHECK (course_outcome IN ('finished', 'stopped_early')),
  added_by UUID REFERENCES users(id),
  confirmed_by TEXT NOT NULL DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX medications_patient ON medications (patient_id, status);

CREATE TABLE dose_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dose_date DATE NOT NULL,
  dose_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed')),
  logged_by UUID REFERENCES users(id),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (medication_id, dose_date, dose_time)
);

CREATE TABLE lab_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  value NUMERIC,
  value_text TEXT,
  unit TEXT,
  measured_on DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('typed', 'abha', 'computed')),
  entered_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX lab_values_patient ON lab_values (patient_id, kind, measured_on DESC);

CREATE TABLE conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  source TEXT NOT NULL CHECK (source IN ('typed', 'abha')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  rule TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  patient_text TEXT NOT NULL,
  clinician_text TEXT NOT NULL,
  reasoning JSONB NOT NULL DEFAULT '[]',
  sources JSONB NOT NULL DEFAULT '[]',
  medication_ids UUID[] NOT NULL,
  rules_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'asked', 'with_prescriber', 'intended', 'not_intended', 'no_longer_applies')
  ),
  reception_result TEXT CHECK (reception_result IN ('matches', 'does_not_match')),
  decision_message TEXT CHECK (decision_message IN ('hold_until_contact', 'review_next_visit')),
  decided_by UUID REFERENCES prescribers(id),
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, fingerprint)
);

CREATE TABLE flag_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (
    actor_type IN ('patient', 'caregiver', 'reception', 'prescriber', 'pharmacy', 'system')
  ),
  actor_name TEXT NOT NULL,
  actor_ref TEXT,
  action TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX flag_events_flag ON flag_events (flag_id, created_at);

CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('reception', 'prescriber', 'patient_answer')),
  flag_id UUID NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  prescriber_id UUID REFERENCES prescribers(id),
  clinic_id UUID REFERENCES clinics(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE link_opens (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cards (
  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE card_views (
  id BIGSERIAL PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  viewer TEXT NOT NULL,
  pharmacy_id UUID,
  ip TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  licence_number TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pharmacy_access (
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (patient_id, pharmacy_id)
);

CREATE TABLE pharmacy_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  flag_id UUID REFERENCES flags(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('told_patient', 'message_doctor', 'checked_medicine')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE abha_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  abha_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'granted', 'denied', 'imported')),
  request_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  flag_id UUID REFERENCES flags(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
