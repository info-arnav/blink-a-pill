export type Ingredient = { key: string; display: string; value: number | null; unit: string | null };

export type Medication = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  dose_amount: number;
  dose_unit: string;
  frequency: string;
  frequency_label: string;
  times: string[];
  meal: string;
  start_date: string;
  duration_days: number | null;
  end_date: string | null;
  days_left: number | null;
  is_antibiotic: boolean;
  prescriber: { id: string; name: string; phone: string | null; speciality: string | null } | null;
  clinic: { id: string; name: string; reception_phone: string | null } | null;
  prescribed_on: string | null;
  source: 'photo' | 'manual' | 'abha';
  status: string;
  confirmed_by: string;
};

export type FlagEvent = {
  id: string;
  actor_type: string;
  actor_name: string;
  actor_ref: string | null;
  action: string;
  note: string | null;
  created_at: string;
};

export type Flag = {
  id: string;
  rule: string;
  severity: number;
  severity_label: string;
  title: string;
  patient_text: string;
  clinician_text: string;
  reasoning: string[];
  sources: { label: string; url: string | null }[];
  medication_ids: string[];
  rules_version: string;
  status: string;
  status_label: string;
  is_open: boolean;
  reception_result: string | null;
  decision: {
    status: string;
    text: string | null;
    by: string | null;
    registration: string | null;
    council: string | null;
    at: string;
    note: string | null;
  } | null;
  events?: FlagEvent[];
  medications?: { id: string; name: string; status: string }[];
  created_at: string;
};

export type Lab = {
  id: string;
  kind: string;
  label: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  measured_on: string;
  source: string;
};

export type PatientSummary = {
  full_name: string;
  age: number;
  gender: string;
  abha_address: string | null;
  weight_kg: number | null;
};

export type PatientRecord = {
  patient: PatientSummary;
  medications: Medication[];
  conditions: { id: string; name: string; source: string }[];
  labs: Lab[];
  flags: Flag[];
};
