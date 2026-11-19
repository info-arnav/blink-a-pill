CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescriber_id UUID REFERENCES prescribers(id),
  clinic_id UUID REFERENCES clinics(id),
  prescribed_on DATE,
  reason TEXT,
  source TEXT NOT NULL CHECK (source IN ('photo', 'abha')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prescriptions_patient ON prescriptions (patient_id, created_at DESC);

ALTER TABLE medications ADD COLUMN prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL;

ALTER TABLE conditions DROP CONSTRAINT conditions_source_check;
ALTER TABLE conditions ADD CONSTRAINT conditions_source_check CHECK (source IN ('typed', 'abha', 'photo'));
ALTER TABLE conditions ADD COLUMN condition_key TEXT;
ALTER TABLE conditions ADD COLUMN certainty TEXT NOT NULL DEFAULT 'confirmed' CHECK (certainty IN ('confirmed', 'provisional', 'history'));
ALTER TABLE conditions ADD COLUMN written_as TEXT;
ALTER TABLE conditions ADD COLUMN prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE;
ALTER TABLE conditions ADD COLUMN prescriber_id UUID REFERENCES prescribers(id);
ALTER TABLE conditions ADD COLUMN noted_on DATE;
