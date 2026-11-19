CREATE TABLE data_imports (
  name TEXT PRIMARY KEY,
  rows INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
