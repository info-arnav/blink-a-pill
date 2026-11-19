import { Badge, Card, severityTone } from '@/shared/ui/primitives';
import { formatDate, formatDateTime, genderLabel } from '@/shared/lib/format';
import type { Flag, Lab, Medication, PatientSummary, FlagEvent } from '../model/types';
import styles from './record.module.css';

export function PatientLine({ patient }: { patient: PatientSummary }) {
  return (
    <div className={styles.patient}>
      <span className={styles.patientName}>{patient.full_name}</span>
      <span className={styles.patientMeta}>
        {patient.age} years · {genderLabel(patient.gender)}
        {patient.weight_kg ? ` · ${patient.weight_kg} kg` : ''}
        {patient.abha_address ? ` · ABHA ${patient.abha_address}` : ''}
      </span>
    </div>
  );
}

const SOURCE = { photo: 'From a prescription photo', manual: 'Typed in', abha: 'From ABHA records' } as const;

export function MedicationList({ medications, flagged = [] }: { medications: Medication[]; flagged?: string[] }) {
  if (!medications.length) return <p className={styles.muted}>No current medicines on the list.</p>;
  return (
    <ul className={styles.list}>
      {medications.map((m) => (
        <li key={m.id} className={`${styles.med} ${flagged.includes(m.id) ? styles.medFlagged : ''}`}>
          <span className={styles.medName}>{m.name}</span>
          {flagged.includes(m.id) ? <Badge tone="sev1">In this concern</Badge> : <span />}
          <span className={styles.composition}>
            {m.ingredients.length
              ? m.ingredients.map((i) => `${i.display}${i.value ? ` ${i.value} ${i.unit ?? ''}` : ''}`).join(' + ')
              : 'Contents unknown, not screened'}
          </span>
          <span className={styles.medMeta}>
            {m.dose_amount} {m.dose_unit} · {m.frequency_label}
            {m.times.length ? ` (${m.times.join(', ')})` : ''}
            {m.meal !== 'any' ? ` · ${m.meal} food` : ''}
            {m.end_date ? ` · until ${formatDate(m.end_date)}` : ''}
          </span>
          <span className={styles.medSource}>
            {m.prescriber ? `Prescribed by ${m.prescriber.name}${m.prescriber.speciality ? ` (${m.prescriber.speciality})` : ''}` : 'Prescriber not recorded'}
            {m.prescribed_on ? ` on ${formatDate(m.prescribed_on)}` : ''} · {SOURCE[m.source]} · Confirmed by: {m.confirmed_by}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LabGrid({ labs }: { labs: Lab[] }) {
  if (!labs.length) return <p className={styles.muted}>No lab values recorded.</p>;
  return (
    <div className={styles.labs}>
      {labs.map((l) => (
        <div key={l.id} className={styles.lab}>
          <div className={styles.labValue}>
            {l.value ?? l.value_text} <span className={styles.muted}>{l.kind === 'child_pugh' ? '' : l.unit}</span>
          </div>
          <div className={styles.labLabel}>{l.label}</div>
          <div className={styles.muted}>
            {formatDate(l.measured_on)} · {l.source === 'computed' ? 'calculated' : l.source === 'abha' ? 'ABHA' : 'typed by patient'}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ events }: { events: FlagEvent[] }) {
  return (
    <ol className={styles.timeline}>
      {events.map((e) => (
        <li key={e.id} className={styles.event}>
          <div>
            <strong>{e.actor_name}</strong>
            {e.actor_ref ? ` (${e.actor_ref})` : ''} {e.action}
            {e.note ? `: ${e.note}` : ''}
          </div>
          <div className={styles.eventWhen}>{formatDateTime(e.created_at)}</div>
        </li>
      ))}
    </ol>
  );
}

export function ConcernCard({
  flag,
  audience,
  medicationNames,
}: {
  flag: Flag;
  audience: 'clinician' | 'patient';
  medicationNames?: string[];
}) {
  return (
    <Card>
      <div className={styles.head}>
        <strong>{flag.title}</strong>
        <Badge tone={severityTone(flag.severity)}>{flag.severity_label}</Badge>
      </div>
      {medicationNames?.length ? <div className={styles.muted}>Medicines: {medicationNames.join(', ')}</div> : null}
      <p style={{ margin: 0 }}>{audience === 'clinician' ? flag.clinician_text : flag.patient_text}</p>
      {flag.decision ? (
        <div className={styles.decision}>
          <strong>{flag.decision.text}</strong>
          <div className={styles.muted}>
            {flag.decision.by}
            {flag.decision.registration ? `, Reg. ${flag.decision.registration}` : ''} · {formatDateTime(flag.decision.at)}
          </div>
        </div>
      ) : (
        <Badge tone="neutral">{flag.status_label}</Badge>
      )}
      <details className={styles.details}>
        <summary>Why this was flagged</summary>
        <ul className={styles.reasoning}>
          {flag.reasoning.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className={styles.sources}>
          {flag.sources.map((s) =>
            s.url ? (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ) : (
              <span key={s.label}>{s.label}</span>
            ),
          )}
          <span>Rules version {flag.rules_version}</span>
        </div>
      </details>
      {flag.events?.length ? (
        <details className={styles.details}>
          <summary>Audit trail</summary>
          <Timeline events={flag.events} />
        </details>
      ) : null}
    </Card>
  );
}
