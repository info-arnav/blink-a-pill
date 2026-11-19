export type Patient = {
  id: string;
  full_name: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  phone: string;
  abha_address: string | null;
  weight_kg: number | null;
  role: 'self' | 'caregiver';
  relation: string | null;
};

export type User = { id: string; phone: string; name: string | null };

export type Ingredient = { key: string; display: string; value: number | null; unit: string | null; strength?: string | null };

export type Product = {
  id: number;
  name: string;
  composition: string;
  manufacturer: string | null;
  form: string | null;
  ingredients: Ingredient[];
  is_antibiotic: boolean;
};

export type Medication = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  dose_amount: number;
  dose_unit: string;
  frequency: string;
  frequency_label: string;
  times: string[];
  meal: 'before' | 'after' | 'with' | 'any';
  start_date: string;
  duration_days: number | null;
  end_date: string | null;
  days_left: number | null;
  is_antibiotic: boolean;
  prescriber: { id: string; name: string; phone: string | null; speciality: string | null } | null;
  clinic: { id: string; name: string; reception_phone: string | null } | null;
  prescribed_on: string | null;
  source: 'photo' | 'manual' | 'abha';
  status: 'active' | 'stopped' | 'completed';
  status_reason: string | null;
  confirmed_by: string;
};

export type Flag = {
  id: string;
  rule: string;
  severity: 1 | 2 | 3;
  severity_label: string;
  title: string;
  patient_text: string;
  reasoning: string[];
  sources: { label: string; url: string | null }[];
  medication_ids: string[];
  rules_version: string;
  status: string;
  status_label: string;
  is_open: boolean;
  decision: { status: string; text: string | null; by: string | null; registration: string | null; at: string } | null;
  medications?: {
    id: string;
    name: string;
    status: string;
    is_new: boolean;
    added_at: string;
    prescriber: { id: string; name: string; phone: string | null } | null;
    clinic: { name: string; reception_phone: string | null } | null;
  }[];
  events?: { id: string; actor_name: string; actor_ref: string | null; action: string; note: string | null; created_at: string }[];
  created_at: string;
};

export type Dose = {
  medication_id: string;
  name: string;
  time: string;
  amount: string;
  meal: string;
  is_antibiotic: boolean;
  status: 'taken' | 'missed' | 'due' | 'upcoming' | 'on_hold';
  hold_note: string | null;
};

export type Day = { date: string; now: string; next: Dose | null; doses: Dose[]; as_needed: { medication_id: string; name: string }[] };

export type CaptureItem = {
  written_name: string;
  strength: string | null;
  dose_amount: number;
  dose_unit: string;
  frequency: string;
  times: string[];
  meal: 'before' | 'after' | 'with' | 'any';
  duration_days: number | null;
  confidence: number;
  candidates: Product[];
};

export type Diagnosis = { written_as: string; name: string; code: string | null; certainty: 'confirmed' | 'provisional' | 'history' };

export type Capture = {
  kind: 'prescription' | 'medicine_pack' | 'other';
  reason: string | null;
  diagnoses: Diagnosis[];
  doctor: { name: string; phone: string | null } | null;
  clinic: { name: string; phone: string | null } | null;
  prescribed_on: string | null;
  items: CaptureItem[];
};

export type Lab = {
  id: string;
  kind: string;
  label?: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  measured_on: string;
  source: string;
};

export type Card = { token: string; pin: string; url: string; qr_svg: string; rotated_at: string };

export type Condition = {
  id: string;
  key: string | null;
  name: string;
  code: string | null;
  certainty: 'confirmed' | 'provisional' | 'history';
  first: { source: string; by: string | null; on: string | null; label: string; written_as: string | null };
  notes: { id: string; source: string; label: string }[];
};

export type Visit = {
  id: string;
  prescribed_on: string | null;
  added_on: string;
  reason: string | null;
  source: 'photo' | 'abha';
  doctor: string | null;
  speciality: string | null;
  clinic: string | null;
  diagnoses: { id: string; name: string; code: string | null; certainty: string; written_as: string | null }[];
  medications: { id: string; name: string; status: string }[];
};
