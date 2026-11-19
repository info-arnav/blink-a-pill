import { Suspense } from 'react';
import type { Metadata } from 'next';
import { api } from '@/shared/api/server';
import { NOINDEX } from '@/shared/lib/seo';
import { formatDateTime } from '@/shared/lib/format';
import { Page, PageTitle } from '@/shared/ui/layout/Page';
import { Mono } from '@/shared/ui/data/Row';
import { Callout } from '@/shared/ui/status/Callout';
import { Skeleton } from '@/shared/ui/status/Skeleton';
import styles from './answer.module.css';

export const metadata: Metadata = { title: 'Your doctor answered', ...NOINDEX };

type View = { title: string; answer: string | null; doctor: string | null; registration: string | null; at: string | null; medications: string[] };

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await api<View>(`/v1/links/answer/${encodeURIComponent(token)}`);
  if (!view.ok) return <Callout tone="danger" title={view.message} />;
  const v = view.data;
  return (
    <>
      <PageTitle overline="Your doctor answered" title={v.answer ?? 'Your doctor has looked at this.'} />
      <dl className={styles.facts}>
        <div>
          <dt>About</dt>
          <dd>{v.title}</dd>
        </div>
        <div>
          <dt>Medicines</dt>
          <dd>{v.medications.join(', ')}</dd>
        </div>
        <div>
          <dt>Answered by</dt>
          <dd>
            {v.doctor}
            {v.registration ? (
              <>
                {', Reg. '}
                <Mono>{v.registration}</Mono>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{formatDateTime(v.at)}</dd>
        </div>
      </dl>
    </>
  );
}

export function AnswerPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Page>
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />
      </Suspense>
    </Page>
  );
}
