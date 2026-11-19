import { Children, isValidElement, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { radius, space, text, useColors, type TextStyleName } from './theme';

export function Txt({
  style = 'body',
  color,
  weight,
  align,
  children,
  numberOfLines,
  selectable,
}: {
  style?: TextStyleName;
  color?: ColorValue;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  children: ReactNode;
  numberOfLines?: number;
  selectable?: boolean;
}) {
  const c = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[text[style], { color: color ?? c.label, textAlign: align }, weight ? { fontWeight: weight } : null]}>
      {children}
    </Text>
  );
}

export function Icon({ name, size = 20, color, fallback }: { name: SFSymbol; size?: number; color?: ColorValue; fallback?: string }) {
  const c = useColors();
  if (Platform.OS !== 'ios') {
    return fallback ? <Text style={{ fontSize: size * 0.8, color: color ?? c.tint }}>{fallback}</Text> : <View style={{ width: size, height: size }} />;
  }
  return <SymbolView name={name} size={size} tintColor={color ?? c.tint} resizeMode="scaleAspectFit" style={{ width: size, height: size }} />;
}

export function Screen({ children, refreshing, onRefresh, padded = true }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; padded?: boolean }) {
  const c = useColors();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.screen, padded ? null : { paddingHorizontal: 0 }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}>
      {children}
    </ScrollView>
  );
}

export function Group({ header, footer, children, style }: { header?: string; footer?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[{ gap: 6 }, style]}>
      {header ? (
        <View style={styles.groupHeader}>
          <Txt style="title3" weight="700">
            {header}
          </Txt>
        </View>
      ) : null}
      {rows.length ? (
        <View style={[styles.group, { backgroundColor: c.surface }]}>
          {rows.map((row, index) => (
            <View key={row.key ?? index}>
              {index > 0 ? <View style={[styles.separator, { backgroundColor: c.separator }]} /> : null}
              {row}
            </View>
          ))}
        </View>
      ) : null}
      {footer ? (
        <View style={styles.groupFooter}>
          {typeof footer === 'string' ? (
            <Txt style="footnote" color={c.secondaryLabel}>
              {footer}
            </Txt>
          ) : (
            footer
          )}
        </View>
      ) : null}
    </View>
  );
}

export function Tile({ symbol, color }: { symbol: SFSymbol; color: ColorValue }) {
  return (
    <View style={[styles.tile, { backgroundColor: color }]}>
      <Icon name={symbol} size={17} color="#FFFFFF" />
    </View>
  );
}

export function Cell({
  title,
  subtitle,
  value,
  leading,
  trailing,
  onPress,
  chevron,
  destructive,
  tint,
  titleLines,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  tint?: boolean;
  titleLines?: number;
}) {
  const c = useColors();
  const body = (
    <View style={styles.cell}>
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt color={destructive ? c.red : tint ? c.tint : c.label} numberOfLines={titleLines}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt style="subhead" color={c.secondaryLabel}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt color={c.secondaryLabel} align="right">
          {value}
        </Txt>
      ) : null}
      {trailing}
      {chevron ? <Icon name="chevron.right" size={13} color={c.tertiaryLabel} fallback="›" /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ backgroundColor: pressed ? c.fill : 'transparent' })}>
      {body}
    </Pressable>
  );
}

type ButtonKind = 'filled' | 'tinted' | 'gray' | 'plain' | 'destructive';

export function Button({
  title,
  onPress,
  kind = 'filled',
  size = 'large',
  busy,
  disabled,
  symbol,
  haptic,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  size?: 'large' | 'medium' | 'small';
  busy?: boolean;
  disabled?: boolean;
  symbol?: SFSymbol;
  haptic?: boolean;
}) {
  const c = useColors();
  const palette: Record<ButtonKind, { bg: ColorValue; fg: ColorValue }> = {
    filled: { bg: c.tint, fg: c.onTint },
    tinted: { bg: c.tintWash, fg: c.tint },
    gray: { bg: c.fill, fg: c.label },
    plain: { bg: 'transparent', fg: c.tint },
    destructive: { bg: c.redWash, fg: c.red },
  };
  const { bg, fg } = palette[kind];
  const height = size === 'large' ? 50 : size === 'medium' ? 44 : 34;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={() => {
        if (haptic && Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={size === 'small' ? 6 : 0}
      style={({ pressed }) => [
        styles.button,
        { minHeight: height, backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1, paddingHorizontal: size === 'small' ? 14 : 20, alignSelf: size === 'small' ? 'auto' : 'stretch' },
      ]}>
      {busy ? <ActivityIndicator color={fg} /> : symbol ? <Icon name={symbol} size={size === 'small' ? 15 : 18} color={fg} /> : null}
      <Text style={[size === 'small' ? text.subhead : text.headline, { color: fg, fontWeight: '600' }]}>{title}</Text>
    </Pressable>
  );
}

export function Pills<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T | null; onChange: (value: T) => void }) {
  const c = useColors();
  return (
    <View style={styles.pills} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (Platform.OS !== 'web') void Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={[styles.pill, { backgroundColor: on ? c.tint : c.fill }]}>
            <Text style={[text.subhead, { color: on ? c.onTint : c.label, fontWeight: on ? '600' : '500' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Input({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={styles.input}>
      <Txt style="footnote" color={c.secondaryLabel}>
        {label}
      </Txt>
      <TextInput placeholderTextColor={c.tertiaryLabel} accessibilityLabel={label} style={[text.body, { color: c.label, paddingVertical: 4, minHeight: 30 }]} clearButtonMode="while-editing" {...input} />
      {hint ? (
        <Txt style="caption" color={c.secondaryLabel}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function Banner({ tone, title, children, onPress, symbol }: { tone: 'red' | 'orange' | 'green' | 'tint'; title: string; children?: ReactNode; onPress?: () => void; symbol?: SFSymbol }) {
  const c = useColors();
  const map = { red: [c.red, c.redWash], orange: [c.orange, c.orangeWash], green: [c.green, c.greenWash], tint: [c.tint, c.tintWash] } as const;
  const [fg, bg] = map[tone];
  const content = (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      {symbol ? <Icon name={symbol} size={20} color={fg} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt style="headline">{title}</Txt>
        {children ? (
          typeof children === 'string' ? (
            <Txt style="subhead" color={c.secondaryLabel}>
              {children}
            </Txt>
          ) : (
            children
          )
        ) : null}
      </View>
      {onPress ? <Icon name="chevron.right" size={13} color={c.tertiaryLabel} fallback="›" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      {content}
    </Pressable>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <View accessibilityRole="alert" style={styles.groupFooter}>
      <Txt style="footnote" color={c.red}>
        {children}
      </Txt>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: space.xxl, alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

export function Empty({ symbol, title, detail, action }: { symbol: SFSymbol; title: string; detail?: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Icon name={symbol} size={44} color={c.tertiaryLabel} />
      <Txt style="title3" align="center">
        {title}
      </Txt>
      {detail ? (
        <Txt style="subhead" color={c.secondaryLabel} align="center">
          {detail}
        </Txt>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxl * 2, gap: space.xxl - 4 },
  group: { borderRadius: radius.group, overflow: 'hidden' },
  groupHeader: { paddingHorizontal: 4, paddingBottom: 2 },
  groupFooter: { paddingHorizontal: space.lg },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: space.lg },
  cell: { minHeight: 44, paddingHorizontal: space.lg, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: space.md },
  tile: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  button: { borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center' },
  input: { paddingHorizontal: space.lg, paddingTop: 10, paddingBottom: 8, gap: 2 },
  banner: { borderRadius: radius.group, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.xl },
});
