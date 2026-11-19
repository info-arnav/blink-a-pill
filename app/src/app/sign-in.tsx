import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Patient, User } from '@/lib/types';
import { Body, Button, Card, Field, Notice, Screen, Title } from '@/ui/kit';
import { useColors } from '@/ui/theme';

function Consent({ on, onToggle, title, text }: { on: boolean; onToggle: () => void; title: string; text: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: on ? c.brand : c.line,
          backgroundColor: on ? c.brand : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
        {on ? <Text style={{ color: c.onBrand, fontWeight: '800' }}>✓</Text> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: c.inkSoft, fontSize: 15, lineHeight: 21 }}>{text}</Text>
      </View>
    </Pressable>
  );
}

export default function SignIn() {
  const { signIn } = useSession();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await api('/v1/auth/otp', { method: 'POST', body: { phone } });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!sharing) {
      setError('Please agree to how your list is shared, so doctors and pharmacists can check it.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ token: string; user: User; patients: Patient[] }>('/v1/auth/verify', {
        method: 'POST',
        body: { phone, code, name: name.trim() || undefined, consent_whatsapp: whatsapp, consent_sharing: sharing },
      });
      await signIn(result.token, result.user, result.patients);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title eyebrow="blink-a-pill">One list for all your medicines</Title>
      <Body muted>We keep every medicine from every doctor in one place, remind you when to take them, and ask your doctor when something looks wrong.</Body>
      {!sent ? (
        <Card>
          <Field label="Your mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" placeholder="10 digit number" maxLength={14} />
          <Body small muted>
            We send a 6 digit code on WhatsApp.
          </Body>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button title="Send code" onPress={send} busy={busy} disabled={phone.replace(/\D/g, '').length < 10} />
        </Card>
      ) : (
        <Card>
          <Field label="6 digit code" value={code} onChangeText={setCode} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} />
          <Field label="Your name" value={name} onChangeText={setName} textContentType="name" autoComplete="name" />
          <Consent
            on={sharing}
            onToggle={() => setSharing((v) => !v)}
            title="Share my list when I ask"
            text="Your list is only shown to a doctor, clinic or pharmacy when you send a link or show your card and PIN. Every view is logged."
          />
          <Consent
            on={whatsapp}
            onToggle={() => setWhatsapp((v) => !v)}
            title="WhatsApp messages"
            text="Codes and doctor answers come on WhatsApp. Medicine names are never written in the message."
          />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button title="Continue" onPress={verify} busy={busy} disabled={code.length !== 6} />
          <Button title="Use a different number" variant="ghost" onPress={() => setSent(false)} />
        </Card>
      )}
    </Screen>
  );
}
