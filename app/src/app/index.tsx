import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session';

export default function Index() {
  const { signedIn, patients } = useSession();
  if (!signedIn) return <Redirect href="/sign-in" />;
  if (!patients.length) return <Redirect href="/onboarding" />;
  return <Redirect href="/today" />;
}
