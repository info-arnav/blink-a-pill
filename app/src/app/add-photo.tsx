import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api, errorMessage, upload } from '@/lib/api';
import { usePatient } from '@/lib/session';
import type { Capture, Flag, Medication } from '@/lib/types';
import { MedicineEditor, draftReady, draftToBody, type Draft } from '@/features/medicine-editor';
import { Body, Button, Card, Field, Heading, Loading, Notice, Screen, Title } from '@/ui/kit';
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
  const [doctor, setDoctor] = useState({ name: '', phone: '' });
  const [clinic, setClinic] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera access is off. You can allow it in Settings, or choose a photo instead.');
        return;
      }
      try {
        result = await ImagePicker.launchCameraAsync(options);
      } catch {
        setError('The camera is not available on this device. Choose a photo instead.');
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
      const read = await upload<Capture>(`/v1/patients/${patient.id}/capture`, {
        uri: asset.uri,
        name: asset.fileName ?? 'prescription.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setCapture(read);
      setDrafts(read.items.map(toDraft));
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
    const raised: Flag[] = [];
    try {
      for (const draft of drafts.filter((d) => d.include)) {
        const result = await api<{ medication: Medication; new_flags: Flag[] }>(`/v1/patients/${patient.id}/medications`, {
          method: 'POST',
          body: {
            ...draftToBody(draft),
            source: 'photo',
            prescribed_on: capture?.prescribed_on ?? undefined,
            prescriber: doctor.name.trim() ? { name: doctor.name.trim(), phone: doctor.phone.trim() || undefined } : undefined,
            clinic: clinic.name.trim() ? { name: clinic.name.trim(), reception_phone: clinic.phone.trim() || undefined } : undefined,
          },
        });
        raised.push(...result.new_flags);
      }
      if (raised.length) router.replace(`/concern/${raised[0].id}?fresh=1`);
      else router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const included = drafts.filter((d) => d.include);

  return (
    <Screen edges={['bottom']}>
      {!capture ? (
        <>
          <Title>Photograph the prescription or strip</Title>
          <Body muted>Lay it flat in good light. We will show you what we read, and you check every line before anything is saved.</Body>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 260, borderRadius: 14 }} resizeMode="cover" accessibilityLabel="Your photo" /> : null}
          {reading ? (
            <Card>
              <Loading />
              <Body muted>Reading your photo…</Body>
            </Card>
          ) : (
            <>
              <Button title="Take a photo" onPress={() => pick('camera')} />
              <Button title="Choose from my photos" variant="secondary" onPress={() => pick('library')} />
              <Button title="Type it instead" variant="ghost" onPress={() => router.replace('/add-manual')} />
            </>
          )}
          {error ? <Notice tone="error">{error}</Notice> : null}
        </>
      ) : (
        <>
          <Title eyebrow="Check every line">This is what we read</Title>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 160, borderRadius: 14 }} resizeMode="cover" accessibilityLabel="Your photo" /> : null}
          {!capture.items.length ? (
            <Notice tone="warn">We could not find any medicines in this photo. Try again with the page flat and in good light, or type it instead.</Notice>
          ) : null}
          <Card>
            <Heading>Who prescribed this?</Heading>
            <Field label="Doctor’s name" value={doctor.name} onChangeText={(name) => setDoctor((d) => ({ ...d, name }))} />
            <Field label="Doctor’s mobile (optional)" value={doctor.phone} onChangeText={(phone) => setDoctor((d) => ({ ...d, phone }))} keyboardType="phone-pad" />
            <Field label="Clinic or hospital" value={clinic.name} onChangeText={(name) => setClinic((d) => ({ ...d, name }))} />
            <Field label="Clinic reception number (optional)" value={clinic.phone} onChangeText={(phone) => setClinic((d) => ({ ...d, phone }))} keyboardType="phone-pad" hint="Used only if you ask the doctor about a concern." />
          </Card>
          {drafts.map((draft, index) => (
            <Card key={`${draft.written}${index}`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.inkFaint, fontSize: 13, fontWeight: '700' }}>LINE {index + 1} · WE READ</Text>
                  <Text style={{ color: c.ink, fontSize: 20, fontWeight: '700' }}>{draft.written}</Text>
                </View>
                <Pressable accessibilityRole="switch" accessibilityState={{ checked: draft.include }} onPress={() => setDrafts((all) => all.map((d, i) => (i === index ? { ...d, include: !d.include } : d)))}>
                  <Text style={{ color: draft.include ? c.sev1 : c.brand, fontWeight: '700' }}>{draft.include ? 'Skip' : 'Add back'}</Text>
                </Pressable>
              </View>
              {draft.include ? (
                <MedicineEditor patientId={patient.id} draft={draft} onChange={(next) => setDrafts((all) => all.map((d, i) => (i === index ? next : d)))} />
              ) : (
                <Body muted>This line will not be added.</Body>
              )}
            </Card>
          ))}
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button
            title={`Add ${included.length} ${included.length === 1 ? 'medicine' : 'medicines'}`}
            onPress={save}
            busy={saving}
            disabled={!included.length || !included.every(draftReady)}
          />
          <Button title="Retake photo" variant="ghost" onPress={() => { setCapture(null); setDrafts([]); setPhoto(null); }} />
        </>
      )}
    </Screen>
  );
}
