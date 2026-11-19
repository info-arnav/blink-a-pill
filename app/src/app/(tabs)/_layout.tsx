import { NativeTabs } from 'expo-router/native-tabs';
import { useColors } from '@/ui/theme';

export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.brand}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cabinet">
        <NativeTabs.Trigger.Label>Cabinet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'pills', selected: 'pills.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="record">
        <NativeTabs.Trigger.Label>My record</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="card">
        <NativeTabs.Trigger.Label>My card</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'qrcode', selected: 'qrcode' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="for-me">
        <NativeTabs.Trigger.Label>For me</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'questionmark.bubble', selected: 'questionmark.bubble.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
