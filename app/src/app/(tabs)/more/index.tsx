import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { usePatient, useSession } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { AMR_GUIDE, AMR_SOURCES } from '@/features/amr-guide';
import { Cell, Group, Icon, Loading, Screen, Tile, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Answers = { questions: { id: string; question: string; answer: string }[] };

function Question({ question, answer, open, onPress }: { question: string; answer: string; open: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <View>
      <Cell title={question} trailing={<Icon name={open ? 'chevron.up' : 'chevron.down'} size={13} color={c.tertiaryLabel} fallback={open ? '˄' : '˅'} />} onPress={onPress} />
      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Txt color={c.secondaryLabel}>{answer}</Txt>
        </View>
      ) : null}
    </View>
  );
}

export default function ForMe() {
  const patient = usePatient();
  const { signOut } = useSession();
  const c = useColors();
  const [open, setOpen] = useState<string | null>('today');
  const { data, loading, refreshing, reload, refresh } = useData(() => api<Answers>(`/v1/patients/${patient.id}/me/answers`), [patient.id]);
  const toggle = (id: string) => setOpen(open === id ? null : id);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Group header="Ask">
        {data ? data.questions.map((q) => <Question key={q.id} question={q.question} answer={q.answer} open={open === q.id} onPress={() => toggle(q.id)} />) : <Loading />}
      </Group>

      <Group header="Antibiotics" footer="From ICMR 2019 and WHO AWaRe guidance.">
        {AMR_GUIDE.map((g) => (
          <Question key={g.q} question={g.q} answer={g.a} open={open === g.q} onPress={() => toggle(g.q)} />
        ))}
        {AMR_SOURCES.map((s) => (
          <Cell key={s.url} title={s.label} tint onPress={() => Linking.openURL(s.url)} />
        ))}
      </Group>

      <Group>
        <Cell title="Family and Caregivers" leading={<Tile symbol="person.2.fill" color={c.blue} />} chevron onPress={() => router.push('/people')} />
        <Cell title="Sign Out" destructive onPress={signOut} />
      </Group>
    </Screen>
  );
}
