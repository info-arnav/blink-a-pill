import { DynamicColorIOS, Platform, PlatformColor, useColorScheme, type ColorValue } from 'react-native';

type Pair = { light: string; dark: string };

const BRAND: Pair = { light: '#0F7A5F', dark: '#3FAE86' };

const FALLBACK = {
  background: { light: '#F2F2F7', dark: '#000000' },
  surface: { light: '#FFFFFF', dark: '#1C1C1E' },
  fill: { light: '#7878801F', dark: '#7878803D' },
  label: { light: '#000000', dark: '#FFFFFF' },
  secondaryLabel: { light: '#3C3C4399', dark: '#EBEBF599' },
  tertiaryLabel: { light: '#3C3C434D', dark: '#EBEBF54D' },
  separator: { light: '#3C3C434A', dark: '#54545899' },
  red: { light: '#FF3B30', dark: '#FF453A' },
  orange: { light: '#FF9500', dark: '#FF9F0A' },
  green: { light: '#34C759', dark: '#30D158' },
  blue: { light: '#007AFF', dark: '#0A84FF' },
} satisfies Record<string, Pair>;

const SYSTEM: Record<keyof typeof FALLBACK, string> = {
  background: 'systemGroupedBackground',
  surface: 'secondarySystemGroupedBackground',
  fill: 'tertiarySystemFill',
  label: 'label',
  secondaryLabel: 'secondaryLabel',
  tertiaryLabel: 'tertiaryLabel',
  separator: 'separator',
  red: 'systemRed',
  orange: 'systemOrange',
  green: 'systemGreen',
  blue: 'systemBlue',
};

export type Colors = Record<keyof typeof FALLBACK | 'tint' | 'onTint' | 'tintWash' | 'redWash' | 'orangeWash' | 'greenWash', ColorValue>;

const wash = (pair: Pair, alpha: string): Pair => ({ light: `${pair.light}${alpha}`, dark: `${pair.dark}${alpha}` });

function build(scheme: 'light' | 'dark'): Colors {
  const pick = (pair: Pair): ColorValue => (Platform.OS === 'ios' ? DynamicColorIOS(pair) : pair[scheme]);
  const system = Object.fromEntries(
    Object.entries(SYSTEM).map(([key, name]) => [key, Platform.OS === 'ios' ? PlatformColor(name) : FALLBACK[key as keyof typeof FALLBACK][scheme]]),
  ) as Record<keyof typeof FALLBACK, ColorValue>;
  return {
    ...system,
    tint: pick(BRAND),
    onTint: '#FFFFFF',
    tintWash: pick(wash(BRAND, '1F')),
    redWash: pick(wash(FALLBACK.red, '1F')),
    orangeWash: pick(wash(FALLBACK.orange, '24')),
    greenWash: pick(wash(FALLBACK.green, '24')),
  };
}

const light = build('light');
const dark = build('dark');

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const BRAND_HEX = BRAND;

export const text = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

export type TextStyleName = keyof typeof text;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 } as const;
export const radius = { control: 12, group: 12, pill: 999 } as const;

export function severityColor(c: Colors, severity: number) {
  if (severity === 1) return { fg: c.red, bg: c.redWash };
  if (severity === 2) return { fg: c.orange, bg: c.orangeWash };
  return { fg: c.secondaryLabel, bg: c.fill };
}
