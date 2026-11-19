import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { Body, Chips, Field } from '@/ui/kit';
import { useColors } from '@/ui/theme';

export type Draft = {
  include: boolean;
  written: string;
  product: Product | null;
  typedName: string;
  candidates: Product[];
  dose_amount: string;
  frequency: 'OD' | 'BD' | 'TID' | 'QID' | 'HS' | 'SOS';
  meal: 'before' | 'after' | 'with' | 'any';
  duration: string;
};

export const FREQUENCY_OPTIONS = [
  { value: 'OD' as const, label: 'Once a day' },
  { value: 'BD' as const, label: 'Twice' },
  { value: 'TID' as const, label: 'Three times' },
  { value: 'QID' as const, label: 'Four times' },
  { value: 'HS' as const, label: 'At bedtime' },
  { value: 'SOS' as const, label: 'Only when needed' },
];

export const MEAL_OPTIONS = [
  { value: 'before' as const, label: 'Before food' },
  { value: 'after' as const, label: 'After food' },
  { value: 'any' as const, label: 'Any time' },
];

function ProductOption({ product, selected, onPress }: { product: Product; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        borderWidth: 2,
        borderColor: selected ? c.brand : c.line,
        backgroundColor: selected ? c.brandTint : c.surface,
        borderRadius: 12,
        padding: 12,
        gap: 2,
      }}>
      <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700' }}>{product.name}</Text>
      <Text style={{ color: c.inkSoft, fontSize: 15 }}>{product.composition}</Text>
      {product.manufacturer ? <Text style={{ color: c.inkFaint, fontSize: 13 }}>{product.manufacturer}</Text> : null}
    </Pressable>
  );
}

export function MedicineEditor({ draft, onChange, patientId }: { draft: Draft; onChange: (next: Draft) => void; patientId: string }) {
  const [results, setResults] = useState<Product[]>([]);
  const [typing, setTyping] = useState(draft.candidates.length === 0);

  useEffect(() => {
    if (!typing || draft.typedName.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        setResults(await api<Product[]>(`/v1/drugs/search?q=${encodeURIComponent(draft.typedName.trim())}`));
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [draft.typedName, typing, patientId]);

  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  return (
    <View style={{ gap: 12 }}>
      {draft.candidates.length && !typing ? (
        <>
          <Body bold>Which one is it?</Body>
          {draft.candidates.map((p) => (
            <ProductOption key={p.id} product={p} selected={draft.product?.id === p.id} onPress={() => set({ product: p })} />
          ))}
          <Pressable accessibilityRole="button" onPress={() => { setTyping(true); set({ product: null, typedName: draft.written }); }}>
            <Body bold>None of these. Let me type it.</Body>
          </Pressable>
        </>
      ) : (
        <>
          <Field label="Medicine name" value={draft.typedName} onChangeText={(v) => set({ typedName: v, product: null })} placeholder="For example Telma 40" autoCorrect={false} />
          {results.slice(0, 5).map((p) => (
            <ProductOption key={p.id} product={p} selected={draft.product?.id === p.id} onPress={() => set({ product: p, typedName: p.name })} />
          ))}
          {draft.typedName.trim().length >= 2 && !draft.product ? (
            <Body small muted>
              If you cannot find it, we will save the name as you typed it. We will not be able to check it against your other medicines.
            </Body>
          ) : null}
        </>
      )}
      <Body bold>How often?</Body>
      <Chips value={draft.frequency} onChange={(frequency) => set({ frequency })} options={FREQUENCY_OPTIONS} />
      <Body bold>When?</Body>
      <Chips value={draft.meal} onChange={(meal) => set({ meal })} options={MEAL_OPTIONS} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Tablets each time" value={draft.dose_amount} onChangeText={(v) => set({ dose_amount: v })} keyboardType="decimal-pad" maxLength={4} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="For how many days" value={draft.duration} onChangeText={(v) => set({ duration: v.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="Leave empty if ongoing" maxLength={4} />
        </View>
      </View>
    </View>
  );
}

export function draftToBody(draft: Draft) {
  const amount = Number(draft.dose_amount);
  return {
    product_id: draft.product?.id,
    name: draft.product ? undefined : draft.typedName.trim(),
    dose_amount: Number.isFinite(amount) && amount > 0 ? amount : 1,
    frequency: draft.frequency,
    meal: draft.meal,
    duration_days: draft.duration ? Number(draft.duration) : undefined,
  };
}

export function draftReady(draft: Draft) {
  return Boolean(draft.product || draft.typedName.trim().length >= 2);
}
