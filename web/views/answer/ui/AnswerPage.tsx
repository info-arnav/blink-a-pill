import { Suspense } from 'react';
import { api } from '@/shared/api/server';
import { Card, Notice, PageTitle, Shell, Skeleton } from '@/shared/ui/primitives';
import { formatDateTime } from '@/shared/lib/format';

type View = { title: string; answer: string | null; doctor: string | null; registration: string | null; at: string | null; medications: string[] };

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await api<View>(`/v1/links/answer/${encodeURIComponent(token)}`);
  if (!view.ok) return <Notice tone="error">{view.message}</Notice>;
  const v = view.data;
  return (
    <>
      <PageTitle eyebrow="Your doctor answered" title={v.answer ?? 'Your doctor has looked at this.'} />
      <Card>
        <div>
          <strong>About:</strong> {v.title}
        </div>
        <div>
          <strong>Medicines:</strong> {v.medications.join(', ')}
        </div>
        <div>
          <strong>Answered by:</strong> {v.doctor}
          {v.registration ? ` (Reg. ${v.registration})` : ''} · {formatDateTime(v.at)}
        </div>
      </Card>
      <Notice tone="info">The same answer is on your card in the blink-a-pill app. If you feel unwell, contact your doctor or go to the nearest hospital.</Notice>
    </>
  );
}

export function AnswerPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Shell>
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
    </Shell>
  );
}
