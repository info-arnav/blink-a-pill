import { Page, PageTitle } from '@/shared/ui/layout/Page';
import { LinkButton } from '@/shared/ui/action/Button';

export default function NotFound() {
  return (
    <Page>
      <PageTitle overline="404" title="This page does not exist" description="The link may have expired or been mistyped. Nothing about anyone’s medicines has changed." />
      <div>
        <LinkButton href="/">Go to link-a-pill</LinkButton>
      </div>
    </Page>
  );
}
