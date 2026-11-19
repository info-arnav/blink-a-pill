import type { ComponentProps, ReactNode } from 'react';
import { useId } from 'react';
import styles from './field.module.css';

export function Field({ label, hint, error, mono, ...input }: ComponentProps<'input'> & { label: string; hint?: ReactNode; error?: string; mono?: boolean }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={`${styles.input} ${mono ? styles.mono : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-help` : undefined}
        {...input}
      />
      {error ? (
        <span id={`${id}-help`} className={styles.error}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-help`} className={styles.hint}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function Select({ label, children, ...select }: ComponentProps<'select'> & { label: string }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select id={id} className={styles.input} {...select}>
        {children}
      </select>
    </div>
  );
}

export function RadioCard({ name, value, title, detail, required }: { name: string; value: string; title: string; detail?: string; required?: boolean }) {
  return (
    <label className={styles.radio}>
      <input type="radio" name={name} value={value} required={required} />
      <span className={styles.radioBody}>
        <span className={styles.radioTitle}>{title}</span>
        {detail ? <span className={styles.radioDetail}>{detail}</span> : null}
      </span>
    </label>
  );
}

export function Fieldset({ legend, description, children }: { legend: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      {description ? <p className={styles.hint}>{description}</p> : null}
      <div className={styles.group}>{children}</div>
    </fieldset>
  );
}
