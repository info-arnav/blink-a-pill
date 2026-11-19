ALTER TABLE flags ADD COLUMN hold_medication_id UUID REFERENCES medications(id) ON DELETE SET NULL;
