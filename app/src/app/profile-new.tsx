import { router } from 'expo-router';
import { useSession } from '@/lib/session';
import type { Patient } from '@/lib/types';
import { ProfileForm } from '@/features/profile-form';
import { Body, Screen, Title } from '@/ui/kit';

export default function ProfileNew() {
  const { refresh, choose } = useSession();

  const done = async (patient: Patient) => {
    await refresh();
    await choose(patient.id);
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <Title>Add a person</Title>
      <Body muted>You can switch between people at the top of every screen.</Body>
      <ProfileForm forSelf={false} onDone={done} />
    </Screen>
  );
}
