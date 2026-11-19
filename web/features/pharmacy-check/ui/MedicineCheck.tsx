'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/shared/ui/action/Button';
import { Field } from '@/shared/ui/field/Field';
import { Badge, severityTone } from '@/shared/ui/status/Badge';
import { Callout } from '@/shared/ui/status/Callout';
import { Stack } from '@/shared/ui/layout/Page';
import { checkMedicine, searchMedicine, type Candidate, type MedicineCheck as Result } from '../api/actions';
import styles from './check.module.css';

export function MedicineCheck({ token }: { token: string }) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [result, setResult] = useState<Result | { error: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2 || result) return;
    const id = setTimeout(() => start(async () => setCandidates(await searchMedicine(query))), 250);
    return () => clearTimeout(id);
  }, [query, result]);

  const pick = (c: Candidate) =>
    start(async () => {
      setCandidates([]);
      setQuery(c.name);
      setResult(await checkMedicine(token, c.id));
    });

  const reset = () => {
    setResult(null);
    setQuery('');
    setCandidates([]);
  };

  return (
    <Stack gap={3}>
      <Field
        label="Medicine"
        placeholder="Brand name, for example Combiflam"
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setResult(null);
          if (e.target.value.trim().length < 2) setCandidates([]);
        }}
      />
      {candidates.length ? (
        <ul className={styles.options} role="listbox" aria-label="Matching medicines">
          {candidates.map((c) => (
            <li key={c.id}>
              <button type="button" role="option" aria-selected={false} className={styles.option} onClick={() => pick(c)}>
                <span>{c.name}</span>
                <span className={styles.composition}>{c.composition}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {pending && !candidates.length ? <span className={styles.muted}>Checking…</span> : null}
      {result && 'error' in result ? <Callout tone="danger" title={result.error} /> : null}
      {result && !('error' in result) ? (
        <Stack gap={3}>
          {result.overlaps.map((o) => (
            <div key={o.title + o.detail} className={styles.overlap}>
              <Badge tone={severityTone(o.severity)}>{o.title}</Badge>
              <span>{o.detail}</span>
            </div>
          ))}
          <Callout tone={result.overlaps.length ? 'warning' : 'info'} title={`${result.medicine.name}: ${result.medicine.composition}`}>
            {result.note}
          </Callout>
          <div>
            <Button variant="quiet" onClick={reset}>
              Check another medicine
            </Button>
          </div>
        </Stack>
      ) : null}
    </Stack>
  );
}
