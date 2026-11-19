ALTER TABLE flags ADD COLUMN trigger_medication_id UUID REFERENCES medications(id) ON DELETE SET NULL;
