import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, useColorScheme } from 'react-native';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { ready, signedIn, patients } = useSession();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const hasPatient = patients.length > 0;

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false, headerTransparent: Platform.OS === 'ios' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasPatient}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && hasPatient}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-photo" options={{ title: 'Scan Prescription', presentation: 'modal' }} />
        <Stack.Screen name="add-manual" options={{ title: 'Add Medicine', presentation: 'modal' }} />
        <Stack.Screen name="medicine/[id]" options={{ title: '' }} />
        <Stack.Screen name="concern/[id]" options={{ title: 'Check With Doctor' }} />
        <Stack.Screen name="lab" options={{ title: 'Add Result', presentation: 'modal' }} />
        <Stack.Screen name="abha" options={{ title: 'ABHA Records', presentation: 'modal' }} />
        <Stack.Screen name="people" options={{ title: 'Family' }} />
        <Stack.Screen name="profile-new" options={{ title: 'Add Person', presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <Navigator />
      </SessionProvider>
    </ThemeProvider>
  );
}
