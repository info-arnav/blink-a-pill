import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { Patient, User } from '@/lib/types';
import { Button, ErrorText, Group, Icon, Input, Screen, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

function Consent({ on, onToggle, title }: { on: boolean; onToggle: () => void; title: string }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      <Icon name={on ? 'checkmark.circle.fill' : 'circle'} size={22} color={on ? c.tint : c.tertiaryLabel} fallback={on ? '●' : '○'} />
      <View style={{ flex: 1 }}>
        <Txt style="subhead">{title}</Txt>
      </View>
    </Pressable>
  );
}

export default function SignIn() {
  const { signIn } = useSession();
  const c = useColors();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, paddingTop: insets.top + 40, backgroundColor: c.background }}>
      <Screen>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Icon name="pills.circle.fill" size={64} color={c.tint} fallback="💊" />
          <Txt style="title1" align="center">
            link-a-pill
          </Txt>
          <Txt style="callout" color={c.secondaryLabel} align="center">
            All your medicines. One list.
          </Txt>
        </View>

        {!sent ? (
          <Group footer="We send a code on WhatsApp.">
            <Input label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" placeholder="10 digits" maxLength={14} autoFocus />
          </Group>
        ) : (
          <>
            <Group>
              <Input label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} autoFocus />
              <Input label="Your name" value={name} onChangeText={setName} textContentType="name" autoComplete="name" />
            </Group>
            <Group footer="Your list is shown only when you send a link or show your card and PIN.">
              <Consent on={sharing} onToggle={() => setSharing((v) => !v)} title="Share my list when I ask" />
              <Consent on={whatsapp} onToggle={() => setWhatsapp((v) => !v)} title="Doctor replies on WhatsApp" />
            </Group>
          </>
        )}

        {error ? <ErrorText>{error}</ErrorText> : null}

        {!sent ? (
          <Button title="Continue" onPress={send} busy={busy} disabled={phone.replace(/\D/g, '').length < 10} />
        ) : (
          <View style={{ gap: 8 }}>
            <Button title="Sign In" onPress={verify} busy={busy} disabled={code.length !== 6 || !sharing} />
            <Button title="Change Number" kind="plain" size="medium" onPress={() => setSent(false)} />
          </View>
        )}
      </Screen>
    </View>
  );
}
