export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g transform="rotate(-38 12 12)">
        <rect x="2.5" y="8" width="19" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6.5 8h5.5v8H6.5a4 4 0 0 1 0-8Z" fill="var(--color-accent)" />
      </g>
    </svg>
  );
}
