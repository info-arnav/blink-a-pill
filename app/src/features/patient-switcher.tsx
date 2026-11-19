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
      ActionSheetIOS.showActionSheetWithOptions({ options: labels, cancelButtonIndex: labels.length - 1, title: 'Show medicines for' }, pick);
    } else {
      Alert.alert('Show medicines for', undefined, [
        ...labels.slice(0, -1).map((label, index) => ({ text: label, onPress: () => pick(index) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const initials = active.full_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Showing ${active.full_name}. Switch person`} onPress={open} hitSlop={8}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: active.role === 'caregiver' ? c.orange : c.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{initials}</Text>
      </View>
    </Pressable>
  );
}
