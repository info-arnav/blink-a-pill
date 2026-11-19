import { Badge, severityTone } from '@/shared/ui/status/Badge';
import { Row, RowList, Mono } from '@/shared/ui/data/Row';
import { formatDate, formatDateTime, genderLabel } from '@/shared/lib/format';
import type { Flag, FlagEvent, Lab, Medication, PatientSummary } from '../model/types';
import styles from './record.module.css';

const SOURCE = { photo: 'Prescription photo', manual: 'Typed in', abha: 'ABHA record' } as const;

export function patientLine(p: PatientSummary) {
  return [`${p.age} years`, genderLabel(p.gender), p.weight_kg ? `${p.weight_kg} kg` : null].filter(Boolean).join(' · ');
}

export function PatientFacts({ patient, conditions }: { patient: PatientSummary; conditions?: { name: string }[] }) {
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Patient</dt>
        <dd>{patient.full_name}</dd>
      </div>
      <div>
        <dt>Age and sex</dt>
        <dd>{patientLine(patient)}</dd>
      </div>
      {conditions?.length ? (
        <div>
          <dt>Conditions</dt>
          <dd>{conditions.map((c) => c.name).join(', ')}</dd>
        </div>
      ) : null}
      {patient.abha_address ? (
        <div>
          <dt>ABHA</dt>
          <dd>
            <Mono>{patient.abha_address}</Mono>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function composition(m: Medication) {
  if (!m.ingredients.length) return 'Contents unknown, not screened';
  return m.ingredients.map((i) => `${i.display}${i.value ? ` ${i.value} ${i.unit ?? ''}`.trimEnd() : ''}`).join(' + ');
}

function schedule(m: Medication) {
  const parts = [`${m.dose_amount} ${m.dose_unit}`, m.frequency_label.toLowerCase()];
  if (m.times.length) parts.push(m.times.join(', '));
  if (m.meal !== 'any') parts.push(`${m.meal} food`);
  if (m.end_date) parts.push(`until ${formatDate(m.end_date)}`);
  return parts.join(' · ');
}

export function MedicationRows({ medications, flagged = [] }: { medications: Medication[]; flagged?: string[] }) {
  if (!medications.length) return <p className={styles.empty}>No current medicines on the list.</p>;
  return (
    <RowList>
      {medications.map((m) => (
        <Row
          key={m.id}
          marked={flagged.includes(m.id)}
          title={m.name}
          meta={`${composition(m)} · ${schedule(m)}`}
          detail={`${m.prescriber ? `${m.prescriber.name}${m.prescriber.speciality ? `, ${m.prescriber.speciality}` : ''}` : 'Prescriber not recorded'}${m.prescribed_on ? `, ${formatDate(m.prescribed_on)}` : ''} · ${SOURCE[m.source]} · Confirmed by ${m.confirmed_by}`}
          status={flagged.includes(m.id) ? <Badge tone="danger">In question</Badge> : m.is_antibiotic ? <Badge tone="accent">Antibiotic</Badge> : undefined}
        />
      ))}
    </RowList>
  );
}

export function LabFacts({ labs }: { labs: Lab[] }) {
  if (!labs.length) return <p className={styles.empty}>No test results recorded.</p>;
  return (
    <dl className={styles.labs}>
      {labs.map((l) => (
        <div key={l.id}>
          <dt>{l.label}</dt>
          <dd>
            <span className={styles.labValue}>{l.value ?? l.value_text}</span>
            {l.kind !== 'child_pugh' && l.unit ? <span className={styles.labUnit}>{l.unit}</span> : null}
          </dd>
          <dd className={styles.labMeta}>
            {formatDate(l.measured_on)} · {l.source === 'computed' ? 'calculated (CKD-EPI 2021)' : l.source === 'abha' ? 'ABHA' : 'typed by patient'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ events }: { events: FlagEvent[] }) {
  return (
    <ol className={styles.timeline}>
      {events.map((e) => (
        <li key={e.id}>
          <span className={styles.eventWhat}>
            <strong>{e.actor_name}</strong>
            {e.actor_ref ? (
              <>
                {' '}
                <Mono>{e.actor_ref}</Mono>
              </>
            ) : null}{' '}
            {e.action}
            {e.note ? <span className={styles.eventNote}> “{e.note}”</span> : null}
          </span>
          <time className={styles.eventWhen} dateTime={e.created_at}>
            {formatDateTime(e.created_at)}
          </time>
        </li>
      ))}
    </ol>
  );
}

export function Concern({ flag, medicationNames, audience = 'clinician' }: { flag: Flag; medicationNames?: string[]; audience?: 'clinician' | 'patient' }) {
  return (
    <article className={styles.concern} data-severity={flag.severity}>
      <header className={styles.concernHead}>
        <h3>{flag.title}</h3>
        <Badge tone={severityTone(flag.severity)}>{flag.severity_label}</Badge>
      </header>
      {medicationNames?.length ? <p className={styles.concernMeds}>{medicationNames.join(' and ')}</p> : null}
      <p className={styles.concernText}>{audience === 'clinician' ? flag.clinician_text : flag.patient_text}</p>
      {flag.decision ? (
        <div className={styles.decision}>
          <p>{flag.decision.text}</p>
          <p className={styles.decisionBy}>
            {flag.decision.by}
            {flag.decision.registration ? (
              <>
                {' · Reg. '}
                <Mono>{flag.decision.registration}</Mono>
              </>
            ) : null}
            {' · '}
            {formatDateTime(flag.decision.at)}
          </p>
        </div>
      ) : (
        <p className={styles.status}>{flag.status_label}</p>
      )}
      <details className={styles.why}>
        <summary>Why this was flagged</summary>
        <ul>
          {flag.reasoning.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className={styles.sources}>
          {flag.sources.map((s, i) => (
            <span key={s.label}>
              {i ? ' · ' : ''}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ) : (
                s.label
              )}
            </span>
          ))}
          <span> · Rules {flag.rules_version}</span>
        </p>
      </details>
    </article>
  );
}
