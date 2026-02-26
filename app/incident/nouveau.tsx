import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';

type IncidentType = 'camion_refuse' | 'suspicion_post_deversement' | 'autre';

const TYPES: { value: IncidentType; label: string; desc: string }[] = [
  { value: 'camion_refuse', label: 'Camion refuse', desc: 'Camion refuse lors du controle' },
  { value: 'suspicion_post_deversement', label: 'Suspicion post-deversement', desc: 'Anomalie detectee apres deversement' },
  { value: 'autre', label: 'Autre incident', desc: 'Autre type incident sur site' },
];

export default function NouvelIncidentScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const chantiersQuery = trpc.chantiers.list.useQuery();
  const chantiers = (chantiersQuery.data ?? []).filter((c: any) => ['autorise', 'en_cours'].includes(c.statut));

  const createMutation = trpc.incidents.create.useMutation({
    onSuccess: (data) => {
      utils.incidents.list.invalidate();
      Alert.alert('Incident cree', "L'incident a ete enregistre.", [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => Alert.alert('Erreur', err.message),
  });

  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<IncidentType>('camion_refuse');
  const [chantierId, setChantierId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [zoneIsolee, setZoneIsolee] = useState(false);
  const [clientInforme, setClientInforme] = useState(false);
  const [notes, setNotes] = useState('');

  const chantierSel = chantiers.find((c: any) => c.id === chantierId);

  function handleSubmit() {
    if (chantierId === null || !chantierSel) {
      Alert.alert('Erreur', 'Selectionnez un chantier.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire.');
      return;
    }
    createMutation.mutate({
      type,
      chantierId,
      chantierNom: chantierSel.societeNom,
      date: today,
      description: description.trim(),
      zoneIsolee,
      clientInforme,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>Annuler</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nouvel incident</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Type incident *</Text>
          {TYPES.map(t => {
            const sel = type === t.value;
            return (
              <Pressable key={t.value} onPress={() => setType(t.value)}
                style={[styles.typeOption, { backgroundColor: sel ? colors.primary + '15' : colors.background, borderColor: sel ? colors.primary : colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.typeLabel, { color: sel ? colors.primary : colors.foreground }]}>{t.label}</Text>
                  <Text style={[styles.typeDesc, { color: colors.muted }]}>{t.desc}</Text>
                </View>
                {sel && <Text style={{ color: colors.primary, fontSize: 18 }}>OK</Text>}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Chantier *</Text>
          {chantiersQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : chantiers.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun chantier autorise</Text>
          ) : (
            chantiers.map((c: any) => {
              const sel = chantierId === c.id;
              return (
                <Pressable key={c.id} onPress={() => setChantierId(c.id)}
                  style={[styles.chantierOption, { backgroundColor: sel ? colors.primary + '15' : colors.background, borderColor: sel ? colors.primary : colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chantierNom, { color: sel ? colors.primary : colors.foreground }]}>{c.societeNom}</Text>
                    <Text style={[styles.chantierLoc, { color: colors.muted }]} numberOfLines={1}>{c.localisationChantier}</Text>
                  </View>
                  {sel && <Text style={{ color: colors.primary, fontSize: 18 }}>OK</Text>}
                </Pressable>
              );
            })
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Description *</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Decrivez l'incident..."
            multiline
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Actions immediates</Text>
          <Pressable onPress={() => setZoneIsolee(!zoneIsolee)}
            style={[styles.toggleRow, { backgroundColor: zoneIsolee ? '#F59E0B15' : colors.background, borderColor: zoneIsolee ? '#F59E0B' : colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Zone isolee</Text>
              <Text style={[styles.toggleDesc, { color: colors.muted }]}>La zone a ete isolee</Text>
            </View>
            <View style={[styles.checkbox, { backgroundColor: zoneIsolee ? '#F59E0B' : 'transparent', borderColor: zoneIsolee ? '#F59E0B' : colors.border }]}>
              {zoneIsolee && <Text style={{ color: '#fff', fontSize: 14 }}>OK</Text>}
            </View>
          </Pressable>
          <Pressable onPress={() => setClientInforme(!clientInforme)}
            style={[styles.toggleRow, { backgroundColor: clientInforme ? '#3B82F615' : colors.background, borderColor: clientInforme ? '#3B82F6' : colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Client informe</Text>
              <Text style={[styles.toggleDesc, { color: colors.muted }]}>Le client a ete contacte</Text>
            </View>
            <View style={[styles.checkbox, { backgroundColor: clientInforme ? '#3B82F6' : 'transparent', borderColor: clientInforme ? '#3B82F6' : colors.border }]}>
              {clientInforme && <Text style={{ color: '#fff', fontSize: 14 }}>OK</Text>}
            </View>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notes (optionnel)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes supplementaires..."
            multiline
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, minHeight: 60 }]}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: '#EF4444', opacity: pressed || createMutation.isPending ? 0.7 : 1 }]}
        >
          {createMutation.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitBtnText}>Declarer l'incident</Text>
          }
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backText: { fontSize: 17 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  typeOption: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeLabel: { fontSize: 15, fontWeight: '600' },
  typeDesc: { fontSize: 12 },
  chantierOption: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chantierNom: { fontSize: 14, fontWeight: '600' },
  chantierLoc: { fontSize: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  textArea: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  toggleRow: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 12 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
