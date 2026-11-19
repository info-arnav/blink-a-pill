import { router } from 'expo-router';
import { useSession } from '@/lib/session';
import type { Patient } from '@/lib/types';
import { ProfileForm } from '@/features/profile-form';
import { Screen } from '@/ui/kit';

export default function ProfileNew() {
  const { refresh, choose } = useSession();

  const done = async (patient: Patient) => {
    await refresh();
    await choose(patient.id);
    router.back();
  };

  return (
    <Screen>
      <ProfileForm forSelf={false} onDone={done} />
    </Screen>
  );
}
