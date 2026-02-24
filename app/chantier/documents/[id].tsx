import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Switch, KeyboardAvoidingView, Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";

export default function DocumentsChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { chantiers, modifierChantier } = useApp();

  const chantier = useMemo(() => chantiers.find(c => c.id === id), [chantiers, id]);

  const [refWalterre, setRefWalterre] = useState(chantier?.referenceWalterre || '');
  const [volumeDeclare, setVolumeDeclare] = useState(chantier?.volumeDeclare?.toString() || '');
  const [regime, setRegime] = useState(chantier?.regimeApplicable || '');
  const [transporteurs, setTransporteurs] = useState(chantier?.transporteurs?.join(', ') || '');
  const [certif, setCertif] = useState(chantier?.certificatQualite || false);
  const [rapport, setRapport] = useState(chantier?.rapportAnalyse || false);
  const [saving, setSaving] = useState(false);

  if (!chantier) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Chantier introuvable</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSave = async () => {
    if (!refWalterre.trim()) {
      Alert.alert('Référence requise', 'Veuillez saisir la référence Walterre.');
      return;
    }
    setSaving(true);
    try {
      await modifierChantier(chantier.id, {
        referenceWalterre: refWalterre.trim(),
        volumeDeclare: parseFloat(volumeDeclare) || undefined,
        regimeApplicable: regime.trim(),
        transporteurs: transporteurs.split(',').map(t => t.trim()).filter(Boolean),
        certificatQualite: certif,
        rapportAnalyse: rapport,
        statut: 'validation_admin',
      });
      Alert.alert('Documents enregistrés', 'Le dossier passe en validation administrative.');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Documents Walterre</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Ces documents sont requis avant toute autorisation de livraison au site.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Référence chantier Walterre <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={refWalterre}
              onChangeText={setRefWalterre}
              placeholder="WAL-2026-XXXX"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Volume déclaré (T)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={volumeDeclare}
              onChangeText={setVolumeDeclare}
              placeholder={chantier.volumeEstime.toString()}
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Régime applicable</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={regime}
              onChangeText={setRegime}
              placeholder="Régime I / II / III"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Transporteurs autorisés</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={transporteurs}
              onChangeText={setTransporteurs}
              placeholder="Transport X, Camions Y"
              placeholderTextColor={colors.muted}
            />
            <Text style={[styles.hint, { color: colors.muted }]}>Séparer par des virgules</Text>
          </View>

          <View style={[styles.docsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.docsTitle, { color: colors.foreground }]}>Documents reçus</Text>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Certificat de qualité des terres</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>Obligatoire — Terres conformes Walterre</Text>
              </View>
              <Switch value={certif} onValueChange={setCertif} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Rapport d'analyse</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>Obligatoire pour validation</Text>
              </View>
              <Switch value={rapport} onValueChange={setRapport} trackColor={{ true: colors.success }} />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnSave, { backgroundColor: saving ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <IconSymbol name="checkmark" size={18} color="#fff" />
            <Text style={styles.btnText}>{saving ? 'Enregistrement...' : 'Enregistrer et passer en validation'}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { padding: 16, gap: 4 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  hint: { fontSize: 11, marginTop: 4 },
  docsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 14, marginBottom: 4 },
  docsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  switchHint: { fontSize: 11, marginTop: 1 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
