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

export default function ValidationChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { chantiers, modifierChantier } = useApp();

  const chantier = useMemo(() => chantiers.find(c => c.id === id), [chantiers, id]);

  const [prixTonne, setPrixTonne] = useState(chantier?.prixTonne?.toString() || '');
  const [conditions, setConditions] = useState(chantier?.conditionsAcceptation || 'Terres conformes Walterre obligatoires. Refus en cas de non-conformité. Facturation sur tonnage accepté.');
  const [refWalterre, setRefWalterre] = useState(chantier?.referenceWalterre || '');
  const [volumeDeclare, setVolumeDeclare] = useState(chantier?.volumeDeclare?.toString() || '');
  const [regime, setRegime] = useState(chantier?.regimeApplicable || '');
  const [transporteurs, setTransporteurs] = useState(chantier?.transporteurs?.join(', ') || '');
  const [certif, setCertif] = useState(chantier?.certificatQualite || false);
  const [rapport, setRapport] = useState(chantier?.rapportAnalyse || false);
  const [valClasse, setValClasse] = useState(chantier?.validationClasse || false);
  const [valCertif, setValCertif] = useState(chantier?.validationCertificat || false);
  const [valRapport, setValRapport] = useState(chantier?.validationRapport || false);
  const [valRegime, setValRegime] = useState(chantier?.validationRegime || false);
  const [valVolume, setValVolume] = useState(chantier?.validationVolume || false);
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

  const toutValide = valClasse && valCertif && valRapport && valRegime && valVolume;

  const handleSave = async (autoriser = false) => {
    setSaving(true);
    try {
      const updates: any = {
        prixTonne: parseFloat(prixTonne) || undefined,
        conditionsAcceptation: conditions,
        referenceWalterre: refWalterre,
        volumeDeclare: parseFloat(volumeDeclare) || undefined,
        regimeApplicable: regime,
        transporteurs: transporteurs.split(',').map(t => t.trim()).filter(Boolean),
        certificatQualite: certif,
        rapportAnalyse: rapport,
        validationClasse: valClasse,
        validationCertificat: valCertif,
        validationRapport: valRapport,
        validationRegime: valRegime,
        validationVolume: valVolume,
      };
      if (autoriser && toutValide) {
        updates.statut = 'autorise';
        updates.dateAutorisation = new Date().toISOString();
      } else if (refWalterre && chantier.statut === 'demande') {
        updates.statut = 'validation_admin';
      }
      await modifierChantier(chantier.id, updates);
      if (autoriser) {
        Alert.alert('Chantier autorisé', 'Le chantier est maintenant autorisé à livrer au site de Transinne.');
      }
      router.back();
    } catch (e) {
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Validation & Documents</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Offre */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Remise de prix</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Prix à la tonne (€)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={prixTonne}
                onChangeText={setPrixTonne}
                placeholder="Ex : 8.50"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Conditions d'acceptation</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, height: 80, textAlignVertical: 'top' }]}
                value={conditions}
                onChangeText={setConditions}
                multiline
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          {/* Documents Walterre */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents Walterre</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Référence chantier Walterre</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={refWalterre}
                onChangeText={setRefWalterre}
                placeholder="WAL-2026-XXXX"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Volume déclaré (T)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={volumeDeclare}
                onChangeText={setVolumeDeclare}
                placeholder="Ex : 4800"
                keyboardType="numeric"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Régime applicable</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={regime}
                onChangeText={setRegime}
                placeholder="Régime I / II / III"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Transporteurs (séparés par virgule)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={transporteurs}
                onChangeText={setTransporteurs}
                placeholder="Transport X, Camions Y"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Certificat de qualité reçu</Text>
              <Switch value={certif} onValueChange={setCertif} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Rapport d'analyse reçu</Text>
              <Switch value={rapport} onValueChange={setRapport} trackColor={{ true: colors.success }} />
            </View>
          </View>

          {/* Validation administrative */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Validation administrative</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>✔ Classe ≤ 2</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>Classe {chantier.classe}</Text>
              </View>
              <Switch value={valClasse} onValueChange={setValClasse} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>✔ Certificat valide</Text>
              <Switch value={valCertif} onValueChange={setValCertif} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>✔ Rapport cohérent</Text>
              <Switch value={valRapport} onValueChange={setValRapport} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>✔ Régime compatible</Text>
              <Switch value={valRegime} onValueChange={setValRegime} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>✔ Volume raisonnable</Text>
              <Switch value={valVolume} onValueChange={setValVolume} trackColor={{ true: colors.success }} />
            </View>

            {toutValide && (
              <View style={[styles.allOkBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                <IconSymbol name="checkmark.seal.fill" size={18} color={colors.success} />
                <Text style={[styles.allOkText, { color: colors.success }]}>
                  Tous les critères sont validés — prêt pour autorisation
                </Text>
              </View>
            )}
          </View>

          {/* Boutons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnSave, { backgroundColor: colors.primary }]}
              onPress={() => handleSave(false)}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
            </TouchableOpacity>
            {toutValide && (
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: colors.success }]}
                onPress={() => handleSave(true)}
                disabled={saving}
                activeOpacity={0.8}
              >
                <IconSymbol name="checkmark.seal.fill" size={18} color="#fff" />
                <Text style={styles.btnText}>Autoriser le chantier</Text>
              </TouchableOpacity>
            )}
          </View>

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
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabelContainer: { flex: 1 },
  switchLabel: { fontSize: 14 },
  switchHint: { fontSize: 11, marginTop: 1 },
  allOkBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 4,
  },
  allOkText: { flex: 1, fontSize: 13, fontWeight: '500' },
  actions: { gap: 10, marginTop: 16 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
