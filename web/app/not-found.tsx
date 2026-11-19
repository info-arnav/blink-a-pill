import { Notice, Shell } from '@/shared/ui/primitives';

export default function NotFound() {
  return (
    <Shell>
      <Notice tone="error">This page does not exist. Check the link you were sent.</Notice>
    </Shell>
  );
}
