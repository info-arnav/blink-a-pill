import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, severityColors, space, type, useColors } from './theme';

export function Screen({
  children,
  refreshing,
  onRefresh,
  edges = ['top'],
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ('top' | 'bottom')[];
}) {
  const c = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={edges}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.brand} /> : undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 4 }}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: c.inkFaint }]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, { color: c.ink }]} accessibilityRole="header">
        {children}
      </Text>
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <Text style={[styles.heading, { color: c.ink }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, muted, small, bold }: { children: ReactNode; muted?: boolean; small?: boolean; bold?: boolean }) {
  const c = useColors();
  return (
    <Text
      style={{
        color: muted ? c.inkSoft : c.ink,
        fontSize: small ? type.small : type.body,
        lineHeight: (small ? type.small : type.body) * 1.4,
        fontWeight: bold ? '600' : '400',
      }}>
      {children}
    </Text>
  );
}

export function Card({ children, tone, style }: { children: ReactNode; tone?: 'brand' | 'warn' | 'ok'; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const bg = tone === 'brand' ? c.brandTint : tone === 'warn' ? c.sev1Tint : tone === 'ok' ? c.okTint : c.surface;
  return <View style={[styles.card, { backgroundColor: bg, borderColor: tone ? 'transparent' : c.line }, style]}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  busy?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

export function Button({ title, onPress, variant = 'primary', busy, disabled, icon }: ButtonProps) {
  const c = useColors();
  const palette = {
    primary: { bg: c.brand, fg: c.onBrand, border: c.brand },
    secondary: { bg: c.surface, fg: c.ink, border: c.line },
    danger: { bg: c.sev1Tint, fg: c.sev1, border: c.sev1Tint },
    ghost: { bg: 'transparent', fg: c.brand, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {busy ? <ActivityIndicator color={palette.fg} /> : icon}
      <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: c.ink }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.inkFaint}
        style={[styles.input, { borderColor: c.line, backgroundColor: c.surface, color: c.ink }]}
        accessibilityLabel={label}
        {...input}
      />
      {hint ? <Text style={{ color: c.inkFaint, fontSize: type.small }}>{hint}</Text> : null}
    </View>
  );
}

export function Badge({ label, severity, tone }: { label: string; severity?: number; tone?: 'ok' | 'neutral' | 'brand' }) {
  const c = useColors();
  const colors = severity
    ? severityColors(c, severity)
    : tone === 'ok'
      ? { fg: c.ok, bg: c.okTint }
      : tone === 'brand'
        ? { fg: c.brand, bg: c.brandTint }
        : { fg: c.inkSoft, bg: c.surfaceMuted };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.fg, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const c = useColors();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, { backgroundColor: on ? c.brand : c.surface, borderColor: on ? c.brand : c.line }]}>
            <Text style={{ color: on ? c.onBrand : c.ink, fontWeight: '600', fontSize: 16 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'ok' | 'warn' }) {
  const c = useColors();
  const colors = { info: { bg: c.brandTint, fg: c.ink }, error: { bg: c.sev1Tint, fg: c.sev1 }, ok: { bg: c.okTint, fg: c.ok }, warn: { bg: c.sev2Tint, fg: c.sev2 } }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: colors.bg }]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Text style={{ color: colors.fg, fontSize: type.small + 1, lineHeight: 22 }}>{children}</Text>
    </View>
  );
}

export function Row({ children, gap = space.sm, wrap }: { children: ReactNode; gap?: number; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }}>{children}</View>;
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ padding: space.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={c.brand} size="large" />
    </View>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />;
}

export function ListItem({ title, subtitle, right, onPress }: { title: string; subtitle?: string; right?: ReactNode; onPress?: () => void }) {
  const c = useColors();
  const content = (
    <View style={styles.listItem}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.ink, fontSize: type.body, fontWeight: '600' }}>{title}</Text>
        {subtitle ? <Text style={{ color: c.inkSoft, fontSize: type.small }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 120, gap: space.lg },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: type.title, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: type.large, fontWeight: '700' },
  card: { borderRadius: radius.md, borderWidth: 1, padding: space.lg, gap: space.md },
  button: {
    minHeight: 54,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonText: { fontSize: type.body, fontWeight: '700' },
  label: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 14, minHeight: 54, fontSize: type.body },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  notice: { borderRadius: radius.sm, padding: space.md },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
});
