import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/lib/session';
import { useColors } from '@/ui/theme';

export function PatientSwitcher() {
  const { patients, active, choose } = useSession();
  const c = useColors();
  if (!active) return null;

  const open = () => {
    const labels = [...patients.map((p) => (p.role === 'self' ? `${p.full_name} (me)` : p.full_name)), 'Add a person', 'Cancel'];
    const pick = (index: number) => {
      if (index < patients.length) void choose(patients[index].id);
      else if (index === patients.length) router.push('/profile-new');
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: labels, cancelButtonIndex: labels.length - 1, title: 'Whose medicines?' }, pick);
    } else {
      Alert.alert('Whose medicines?', undefined, [
        ...labels.slice(0, -1).map((label, index) => ({ text: label, onPress: () => pick(index) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Showing ${active.full_name}. Change person`} onPress={open}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.onBrand, fontWeight: '700' }}>{active.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={{ color: c.ink, fontWeight: '600', fontSize: 16 }}>
          {active.role === 'caregiver' ? `Caring for ${active.full_name.split(' ')[0]}` : active.full_name.split(' ')[0]}
        </Text>
        <Text style={{ color: c.inkFaint }}>▾</Text>
      </View>
    </Pressable>
  );
}
