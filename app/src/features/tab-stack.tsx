import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { PatientSwitcher } from './patient-switcher';

export function TabStack({ title }: { title: string }) {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="index" options={{ title, headerRight: () => <PatientSwitcher /> }} />
    </Stack>
  );
}
