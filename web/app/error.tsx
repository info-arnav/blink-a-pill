'use client';

import { Page, PageTitle } from '@/shared/ui/layout/Page';
import { Button } from '@/shared/ui/action/Button';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Page>
      <PageTitle title="Something went wrong" description="Nothing about anyone’s medicines has changed. Please try again." />
      <div>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </Page>
  );
}
