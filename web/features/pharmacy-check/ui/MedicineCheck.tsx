'use client';

import { useEffect, useState, useTransition } from 'react';
import { Badge, Button, Field, Notice, Stack, severityTone } from '@/shared/ui/primitives';
import { checkMedicine, searchMedicine, type Candidate, type MedicineCheck as Result } from '../api/actions';
import styles from './check.module.css';

export function MedicineCheck({ token }: { token: string }) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [result, setResult] = useState<Result | { error: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const id = setTimeout(() => {
      start(async () => setCandidates(await searchMedicine(query)));
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const pick = (c: Candidate) =>
    start(async () => {
      setCandidates([]);
      setQuery(c.name);
      setResult(await checkMedicine(token, c.id));
    });

  return (
    <Stack>
      <Field
        label="Check one medicine against this patient's list"
        placeholder="Type a brand, for example Combiflam"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setResult(null);
          if (e.target.value.trim().length < 2) setCandidates([]);
        }}
      />
      {candidates.length ? (
        <ul className={styles.options}>
          {candidates.map((c) => (
            <li key={c.id}>
              <button type="button" className={styles.option} onClick={() => pick(c)}>
                <strong>{c.name}</strong>
                <span>{c.composition}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {pending ? <span className={styles.muted}>Checking…</span> : null}
      {result && 'error' in result ? <Notice tone="error">{result.error}</Notice> : null}
      {result && !('error' in result) ? (
        <div className={styles.result}>
          <strong>{result.medicine.name}</strong>
          <span className={styles.muted}>{result.medicine.composition}</span>
          {result.overlaps.map((o) => (
            <div key={o.title + o.detail} className={styles.overlap}>
              <Badge tone={severityTone(o.severity)}>{o.title}</Badge>
              <span>{o.detail}</span>
            </div>
          ))}
          <Notice tone={result.overlaps.length ? 'warn' : 'info'}>{result.note}</Notice>
          <Button type="button" variant="secondary" onClick={() => { setResult(null); setQuery(''); }}>
            Check another
          </Button>
        </div>
      ) : null}
    </Stack>
  );
}
