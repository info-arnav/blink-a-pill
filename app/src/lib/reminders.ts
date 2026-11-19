import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function syncReminders(patientName: string, medications: Medication[], held: Set<string>) {
  if (Platform.OS === 'web') return;
  if (!(await ensurePermission())) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('doses', { name: 'Medicine reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  const slots = new Map<string, number>();
  for (const m of medications) {
    if (m.status !== 'active' || held.has(m.id)) continue;
    for (const t of m.times) slots.set(t, (slots.get(t) ?? 0) + 1);
  }
  for (const [time, count] of slots) {
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Medicine time, ${patientName.split(' ')[0]}`,
        body: `${count} ${count === 1 ? 'medicine' : 'medicines'} due at ${time}. Open the app and tap "I took it".`,
        data: { url: '/' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'doses' },
    });
  }
}
