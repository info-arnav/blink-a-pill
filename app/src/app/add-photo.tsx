import { useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { api, errorMessage, sendPhoto } from '@/lib/api';
import { usePatient } from '@/lib/session';
import type { Capture, Diagnosis, Flag } from '@/lib/types';
import { MedicineEditor, draftReady, draftToBody, type Draft } from '@/features/medicine-editor';
import { Button, Cell, Empty, ErrorText, Group, Icon, Input, Loading, Screen, Txt } from '@/ui/kit';
import { useColors } from '@/ui/theme';

const FREQ = new Set(['OD', 'BD', 'TID', 'QID', 'HS', 'SOS']);

function toDraft(item: Capture['items'][number]): Draft {
  return {
    include: true,
    written: item.written_name,
    product: item.candidates[0] ?? null,
    typedName: item.written_name,
    candidates: item.candidates,
    dose_amount: String(item.dose_amount ?? 1),
    frequency: (FREQ.has(item.frequency) ? item.frequency : 'OD') as Draft['frequency'],
    meal: item.meal === 'with' ? 'after' : item.meal,
    duration: item.duration_days ? String(item.duration_days) : '',
  };
}

export default function AddPhoto() {
  const patient = usePatient();
  const c = useColors();
  const [photo, setPhoto] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [diagnoses, setDiagnoses] = useState<(Diagnosis & { keep: boolean })[]>([]);
  const [doctor, setDoctor] = useState({ name: '', phone: '' });
  const [clinic, setClinic] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera access is off. Allow it in Settings, or choose a photo.');
        return;
      }
      try {
        result = await ImagePicker.launchCameraAsync(options);
      } catch {
        setError('No camera on this device. Choose a photo instead.');
        return;
      }
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhoto(asset.uri);
    setReading(true);
    try {
      const longest = Math.max(asset.width, asset.height);
      const context = ImageManipulator.manipulate(asset.uri);
      if (longest > 1800) context.resize(asset.width >= asset.height ? { width: 1800 } : { height: 1800 });
      const image = await (await context.renderAsync()).saveAsync({ compress: 0.75, format: SaveFormat.JPEG, base64: true });
      if (!image.base64) throw new Error('Could not prepare the photo. Try again.');
      const read = await sendPhoto<Capture>(`/v1/patients/${patient.id}/capture`, { data: image.base64, mime_type: 'image/jpeg' });
      setCapture(read);
      setDrafts(read.items.map(toDraft));
      setDiagnoses(read.diagnoses.map((d) => ({ ...d, keep: true })));
      setDoctor({ name: read.doctor?.name ?? '', phone: read.doctor?.phone ?? '' });
      setClinic({ name: read.clinic?.name ?? '', phone: read.clinic?.phone ?? '' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ new_flags: Flag[] }>(`/v1/patients/${patient.id}/prescriptions`, {
        method: 'POST',
        body: {
          prescriber: doctor.name.trim() ? { name: doctor.name.trim(), phone: doctor.phone.trim() || undefined } : undefined,
          clinic: clinic.name.trim() ? { name: clinic.name.trim(), reception_phone: clinic.phone.trim() || undefined } : undefined,
          prescribed_on: capture?.prescribed_on ?? undefined,
          reason: capture?.reason ?? undefined,
          diagnoses: diagnoses.filter((d) => d.keep).map((d) => ({ name: d.name, written_as: d.written_as, certainty: d.certainty })),
          medications: drafts.filter((d) => d.include).map(draftToBody),
        },
      });
      if (result.new_flags.length) router.replace(`/concern/${result.new_flags[0].id}?fresh=1`);
      else router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const included = drafts.filter((d) => d.include);

  if (!capture) {
    return (
      <Screen>
        {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 280, borderRadius: 12 }} resizeMode="cover" accessibilityLabel="Your photo" /> : null}
        {reading ? (
          <View style={{ gap: 8 }}>
            <Loading />
            <Txt style="subhead" color={c.secondaryLabel} align="center">
              Reading…
            </Txt>
          </View>
        ) : (
          <>
            {!photo ? <Empty symbol="doc.text.viewfinder" title="Photograph the prescription" detail="Flat, in good light. You check every line before saving." /> : null}
            <View style={{ gap: 10 }}>
              <Button title="Take Photo" symbol="camera.fill" onPress={() => pick('camera')} />
              <Button title="Choose Photo" symbol="photo.on.rectangle" kind="gray" onPress={() => pick('library')} />
            </View>
          </>
        )}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 140, borderRadius: 12 }} resizeMode="cover" accessibilityLabel="Your photo" /> : null}
      {!capture.items.length && !capture.diagnoses.length ? <Empty symbol="questionmark.text.page" title="Nothing found" detail="Try again flat and in good light." /> : null}

      {diagnoses.length || capture.reason ? (
        <Group header="Diagnosis" footer={doctor.name ? `As written by ${doctor.name}. Untick anything we read wrong.` : 'Untick anything we read wrong.'}>
          {capture.reason ? <Cell title={capture.reason} subtitle="Reason for visit" /> : null}
          {diagnoses.map((d, index) => (
            <Cell
              key={`${d.written_as}${index}`}
              title={d.name}
              subtitle={[d.written_as !== d.name ? `“${d.written_as}”` : null, d.certainty === 'provisional' ? 'Provisional' : d.certainty === 'history' ? 'Known condition' : null].filter(Boolean).join(' · ') || undefined}
              onPress={() => setDiagnoses((all) => all.map((x, i) => (i === index ? { ...x, keep: !x.keep } : x)))}
              trailing={<Icon name={d.keep ? 'checkmark.circle.fill' : 'circle'} size={22} color={d.keep ? c.tint : c.tertiaryLabel} fallback={d.keep ? '●' : '○'} />}
            />
          ))}
        </Group>
      ) : null}

      <Group header="Prescribed By">
        <Input label="Doctor" value={doctor.name} onChangeText={(name) => setDoctor((d) => ({ ...d, name }))} />
        <Input label="Doctor’s mobile" value={doctor.phone} onChangeText={(phone) => setDoctor((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
        <Input label="Clinic" value={clinic.name} onChangeText={(name) => setClinic((d) => ({ ...d, name }))} />
        <Input label="Clinic reception" value={clinic.phone} onChangeText={(phone) => setClinic((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
      </Group>

      {drafts.map((draft, index) => (
        <View key={`${draft.written}${index}`} style={{ gap: 8 }}>
          {draft.include ? (
            <MedicineEditor label={`We read “${draft.written}”`} draft={draft} onChange={(next) => setDrafts((all) => all.map((d, i) => (i === index ? next : d)))} />
          ) : (
            <Group>
              <Cell title={draft.written} subtitle="Skipped" />
            </Group>
          )}
          <Button
            title={draft.include ? 'Skip This Line' : 'Add Back'}
            kind="plain"
            size="small"
            onPress={() => setDrafts((all) => all.map((d, i) => (i === index ? { ...d, include: !d.include } : d)))}
          />
        </View>
      ))}

      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        title={included.length ? `Add ${included.length} ${included.length === 1 ? 'Medicine' : 'Medicines'}` : 'Save Diagnosis'}
        onPress={save}
        busy={saving}
        disabled={(!included.length && !diagnoses.some((d) => d.keep)) || !included.every(draftReady)}
      />
      <Button title="Retake" kind="plain" size="medium" onPress={() => { setCapture(null); setDrafts([]); setPhoto(null); }} />
    </Screen>
  );
}
