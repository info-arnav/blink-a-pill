import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { Cell, Group, Icon, Input, Pills, Txt } from '@/ui/kit';
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
  { value: 'OD' as const, label: 'Once' },
  { value: 'BD' as const, label: 'Twice' },
  { value: 'TID' as const, label: '3 times' },
  { value: 'QID' as const, label: '4 times' },
  { value: 'HS' as const, label: 'Bedtime' },
  { value: 'SOS' as const, label: 'When needed' },
];

export const MEAL_OPTIONS = [
  { value: 'before' as const, label: 'Before food' },
  { value: 'after' as const, label: 'After food' },
  { value: 'any' as const, label: 'Any time' },
];

function Option({ product, selected, onPress }: { product: Product; selected: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Cell
      title={product.name}
      subtitle={product.composition}
      onPress={onPress}
      trailing={selected ? <Icon name="checkmark" size={17} color={c.tint} fallback="✓" /> : <View style={{ width: 17 }} />}
    />
  );
}

export function MedicineEditor({ draft, onChange, label }: { draft: Draft; onChange: (next: Draft) => void; label?: string }) {
  const c = useColors();
  const [results, setResults] = useState<Product[]>([]);
  const [typing, setTyping] = useState(draft.candidates.length === 0);
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  useEffect(() => {
    if (!typing || draft.typedName.trim().length < 2 || draft.product?.name === draft.typedName) return;
    const id = setTimeout(async () => {
      try {
        setResults(await api<Product[]>(`/v1/drugs/search?q=${encodeURIComponent(draft.typedName.trim())}`));
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [draft.typedName, draft.product, typing]);

  return (
    <View style={{ gap: 16 }}>
      {draft.candidates.length && !typing ? (
        <Group header={label} footer="Pick the one on your strip or prescription.">
          {draft.candidates.map((p) => (
            <Option key={p.id} product={p} selected={draft.product?.id === p.id} onPress={() => set({ product: p })} />
          ))}
          <Cell title="None of these" tint onPress={() => { setTyping(true); set({ product: null, typedName: draft.written }); }} />
        </Group>
      ) : (
        <Group header={label} footer={draft.typedName.trim().length >= 2 && !draft.product ? 'Not found? It will be saved as typed, but can’t be checked.' : undefined}>
          <Input label="Medicine" value={draft.typedName} onChangeText={(v) => set({ typedName: v, product: null })} placeholder="Telma 40" autoCorrect={false} />
          {(draft.product ? [draft.product] : results.slice(0, 5)).map((p) => (
            <Option key={p.id} product={p} selected={draft.product?.id === p.id} onPress={() => set({ product: p, typedName: p.name })} />
          ))}
        </Group>
      )}
      <View style={{ gap: 8 }}>
        <Txt style="footnote" color={c.secondaryLabel}>
          HOW OFTEN
        </Txt>
        <Pills value={draft.frequency} onChange={(frequency) => set({ frequency })} options={FREQUENCY_OPTIONS} />
      </View>
      <Pills value={draft.meal} onChange={(meal) => set({ meal })} options={MEAL_OPTIONS} />
      <Group>
        <Input label="Tablets each time" value={draft.dose_amount} onChangeText={(v) => set({ dose_amount: v })} keyboardType="decimal-pad" maxLength={4} />
        <Input label="Days (empty if ongoing)" value={draft.duration} onChangeText={(v) => set({ duration: v.replace(/\D/g, '') })} keyboardType="number-pad" maxLength={4} />
      </Group>
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
