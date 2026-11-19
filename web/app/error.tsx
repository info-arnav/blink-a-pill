'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1>Something went wrong</h1>
      <p>Please try again. Nothing about the patient’s medicines has been changed.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
