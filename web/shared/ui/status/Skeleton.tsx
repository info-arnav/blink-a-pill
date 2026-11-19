import styles from './Skeleton.module.css';

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.group} aria-busy="true" aria-label="Loading">
      <span className={`${styles.bar} ${styles.title}`} />
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={styles.bar} />
      ))}
    </div>
  );
}
