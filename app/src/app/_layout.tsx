import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
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
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasPatient}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && hasPatient}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-photo" options={{ title: 'Add from a photo', presentation: 'modal' }} />
        <Stack.Screen name="add-manual" options={{ title: 'Type a medicine', presentation: 'modal' }} />
        <Stack.Screen name="medicine/[id]" options={{ title: 'Medicine' }} />
        <Stack.Screen name="concern/[id]" options={{ title: 'Something to check' }} />
        <Stack.Screen name="lab" options={{ title: 'Add a test result', presentation: 'modal' }} />
        <Stack.Screen name="abha" options={{ title: 'Link ABHA records', presentation: 'modal' }} />
        <Stack.Screen name="people" options={{ title: 'Family and caregivers' }} />
        <Stack.Screen name="profile-new" options={{ title: 'Add a person', presentation: 'modal' }} />
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
