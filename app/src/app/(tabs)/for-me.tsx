import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { usePatient, useSession } from '@/lib/session';
import { useData } from '@/lib/use-data';
import { AMR_GUIDE, AMR_SOURCES } from '@/features/amr-guide';
import { PatientSwitcher } from '@/features/patient-switcher';
import { Body, Button, Card, Heading, Loading, Screen, Title } from '@/ui/kit';
import { useColors } from '@/ui/theme';

type Answers = { questions: { id: string; question: string; answer: string }[] };

function Question({ question, answer, open, onPress }: { question: string; answer: string; open: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onPress}>
      <View style={{ backgroundColor: open ? c.brandTint : c.surface, borderColor: c.line, borderWidth: open ? 0 : 1, borderRadius: 14, padding: 16, gap: 8 }}>
        <Text style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{question}</Text>
        {open ? <Text style={{ color: c.ink, fontSize: 18, lineHeight: 27 }}>{answer}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function ForMe() {
  const patient = usePatient();
  const { signOut } = useSession();
  const c = useColors();
  const [open, setOpen] = useState<string | null>('today');
  const { data, loading, reload } = useData(() => api<Answers>(`/v1/patients/${patient.id}/me/answers`), [patient.id]);

  return (
    <Screen refreshing={loading && Boolean(data)} onRefresh={reload}>
      <PatientSwitcher />
      <Title eyebrow="For me">Simple answers</Title>
      {!data ? <Loading /> : null}
      {data?.questions.map((q) => (
        <Question key={q.id} question={q.question} answer={q.answer} open={open === q.id} onPress={() => setOpen(open === q.id ? null : q.id)} />
      ))}

      <Heading>Antibiotics: use them right</Heading>
      {AMR_GUIDE.map((g) => (
        <Question key={g.q} question={g.q} answer={g.a} open={open === g.q} onPress={() => setOpen(open === g.q ? null : g.q)} />
      ))}
      {AMR_SOURCES.map((s) => (
        <Text key={s.url} style={{ color: c.brand, fontSize: 15 }} onPress={() => Linking.openURL(s.url)}>
          {s.label}
        </Text>
      ))}

      <Card>
        <Heading>Family and caregivers</Heading>
        <Body muted>Let a family member manage medicines from their own phone, or add a parent you look after.</Body>
        <Button title="Manage" variant="secondary" onPress={() => router.push('/people')} />
      </Card>
      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
