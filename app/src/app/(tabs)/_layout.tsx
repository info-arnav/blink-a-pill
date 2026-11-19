import { NativeTabs } from 'expo-router/native-tabs';
import { useColors } from '@/ui/theme';

export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.tint}>
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cabinet">
        <NativeTabs.Trigger.Label>Medicines</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'pills', selected: 'pills.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="record">
        <NativeTabs.Trigger.Label>Record</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'heart.text.square', selected: 'heart.text.square.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="card">
        <NativeTabs.Trigger.Label>Card</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'qrcode', selected: 'qrcode' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>For Me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
