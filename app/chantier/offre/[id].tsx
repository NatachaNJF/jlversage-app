import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, KeyboardAvoidingView, Platform, Switch
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";

export default function OffreChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { chantiers, modifierChantier } = useApp();

  const chantier = useMemo(() => chantiers.find(c => c.id === id), [chantiers, id]);

  const [prixTonne, setPrixTonne] = useState(chantier?.prixTonne?.toString() || '');
  const [conditions, setConditions] = useState(
    chantier?.conditionsAcceptation ||
    'Terres conformes Walterre obligatoires. Refus en cas de non-conformité. Facturation sur tonnage accepté.'
  );
  const [confirmationClient, setConfirmationClient] = useState(chantier?.confirmationClient || false);
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

  const handleSave = async (demanderDocs = false) => {
    if (!prixTonne.trim()) {
      Alert.alert('Prix requis', 'Veuillez saisir le prix à la tonne.');
      return;
    }
    setSaving(true);
    try {
      const updates: any = {
        prixTonne: parseFloat(prixTonne),
        conditionsAcceptation: conditions,
        confirmationClient,
        statut: 'offre_envoyee',
      };
      if (confirmationClient && demanderDocs) {
        updates.statut = 'documents_demandes';
        updates.dateConfirmation = new Date().toISOString();
      }
      await modifierChantier(chantier.id, updates);
      if (demanderDocs && confirmationClient) {
        Alert.alert('Accord commercial', 'L\'offre est confirmée. Vous pouvez maintenant demander les documents Walterre.');
      }
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Remise de prix</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Récap chantier */}
          <View style={[styles.recapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.recapNom, { color: colors.foreground }]}>{chantier.societe.nom}</Text>
            <Text style={[styles.recapInfo, { color: colors.muted }]}>
              {chantier.localisationChantier} · Classe {chantier.classe} · {chantier.volumeEstime} T
            </Text>
          </View>

          {/* Analyse interne */}
          <View style={[styles.analyseCard, {
            backgroundColor: chantier.classe <= 2 ? colors.success + '10' : colors.error + '10',
            borderColor: chantier.classe <= 2 ? colors.success : colors.error,
          }]}>
            <IconSymbol
              name={chantier.classe <= 2 ? "checkmark.circle.fill" : "xmark.circle.fill"}
              size={18}
              color={chantier.classe <= 2 ? colors.success : colors.error}
            />
            <Text style={[styles.analyseText, { color: chantier.classe <= 2 ? colors.success : colors.error }]}>
              {chantier.classe <= 2
                ? `Classe ${chantier.classe} — Acceptable (≤ 2)`
                : `Classe ${chantier.classe} — Refus recommandé (> 2)`
              }
            </Text>
          </View>

          {/* Prix */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Prix à la tonne (€) <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.inputLarge, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={prixTonne}
              onChangeText={setPrixTonne}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.muted}
            />
            {prixTonne && chantier.volumeEstime && (
              <Text style={[styles.estimation, { color: colors.muted }]}>
                Estimation : {(parseFloat(prixTonne) * chantier.volumeEstime).toFixed(0)} € pour {chantier.volumeEstime} T
              </Text>
            )}
          </View>

          {/* Conditions */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Conditions d'acceptation</Text>
            <TextInput
              style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={conditions}
              onChangeText={setConditions}
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Confirmation client */}
          <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Confirmation client reçue</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>
                  Par mail ou dans l'application
                </Text>
              </View>
              <Switch
                value={confirmationClient}
                onValueChange={setConfirmationClient}
                trackColor={{ true: colors.success }}
              />
            </View>
          </View>

          {/* Boutons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnSave, { backgroundColor: colors.primary }]}
              onPress={() => handleSave(false)}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>{saving ? 'Enregistrement...' : 'Enregistrer l\'offre'}</Text>
            </TouchableOpacity>
            {confirmationClient && (
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: colors.success }]}
                onPress={() => handleSave(true)}
                disabled={saving}
                activeOpacity={0.8}
              >
                <IconSymbol name="doc.badge.plus" size={18} color="#fff" />
                <Text style={styles.btnText}>Confirmer et demander les documents</Text>
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
  recapCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12, gap: 4 },
  recapNom: { fontSize: 15, fontWeight: '600' },
  recapInfo: { fontSize: 13 },
  analyseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  analyseText: { fontSize: 13, fontWeight: '600' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputLarge: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 28, fontWeight: '700', textAlign: 'center',
  },
  estimation: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  textarea: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 14, minHeight: 100,
  },
  confirmCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabelContainer: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  switchHint: { fontSize: 11, marginTop: 1 },
  actions: { gap: 10, marginTop: 16 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
