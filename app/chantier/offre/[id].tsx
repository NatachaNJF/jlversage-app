import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { showAlert } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function OffreChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const chantier = chantierQuery.data;

  const envoyerOffreMutation = trpc.chantiers.envoyerOffre.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Offre envoyée', "L'offre de prix a été envoyée par email au client.");
      router.back();
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible d\'envoyer l\'offre.'),
  });

  const confirmerAccordMutation = trpc.chantiers.confirmerAccordClient.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Accord confirmé', 'L\'accord client est enregistré. Vous pouvez maintenant saisir les documents Walterre.');
      router.back();
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de confirmer l\'accord.'),
  });

  const [prixTonne, setPrixTonne] = useState('');
  const [conditions, setConditions] = useState('Terres conformes Walterre obligatoires. Refus en cas de non-conformité. Facturation sur tonnage accepté.');
  const [initialized, setInitialized] = useState(false);

  if (chantier && !initialized) {
    setPrixTonne(chantier.prixTonne?.toString() || '');
    setConditions(chantier.conditionsAcceptation || 'Terres conformes Walterre obligatoires. Refus en cas de non-conformité. Facturation sur tonnage accepté.');
    setInitialized(true);
  }

  if (chantierQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!chantier) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Chantier introuvable</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleEnvoyerOffre = () => {
    const prix = parseFloat(prixTonne);
    if (!prixTonne.trim() || isNaN(prix) || prix <= 0) {
      showAlert('Prix requis', 'Veuillez saisir un prix à la tonne valide.');
      return;
    }
    if (!conditions.trim()) {
      showAlert('Conditions requises', 'Veuillez saisir les conditions d\'acceptation.');
      return;
    }
    envoyerOffreMutation.mutate({ id: Number(id), prixTonne: prix, conditionsAcceptation: conditions.trim() });
  };

  const handleConfirmerAccord = () => {
    confirmerAccordMutation.mutate({ id: Number(id) });
  };

  const saving = envoyerOffreMutation.isPending || confirmerAccordMutation.isPending;

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
            <Text style={[styles.recapNom, { color: colors.foreground }]}>{chantier.societeNom}</Text>
            <Text style={[styles.recapInfo, { color: colors.muted }]}>
              {chantier.localisationChantier} · Classe {chantier.classe} · {Number(chantier.volumeEstime).toFixed(0)} T
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

          {/* Statut actuel */}
          {chantier.statut === 'offre_envoyee' && (
            <View style={[styles.statusBox, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}>
              <IconSymbol name="paperplane.fill" size={16} color="#3B82F6" />
              <Text style={[styles.statusText, { color: '#3B82F6' }]}>
                Offre envoyée le {chantier.dateCreation ? new Date(chantier.dateCreation).toLocaleDateString('fr-BE') : '—'}
                {chantier.prixTonne ? ` · ${Number(chantier.prixTonne).toFixed(2)} €/T` : ''}
              </Text>
            </View>
          )}

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
              returnKeyType="next"
            />
            {prixTonne && !isNaN(parseFloat(prixTonne)) && (
              <Text style={[styles.estimation, { color: colors.muted }]}>
                Estimation : {(parseFloat(prixTonne) * Number(chantier.volumeEstime)).toFixed(0)} € pour {Number(chantier.volumeEstime).toFixed(0)} T
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
              returnKeyType="done"
            />
          </View>

          {/* Boutons */}
          <View style={styles.actions}>
            {/* Envoyer l'offre (disponible en analyse ou pour renvoyer) */}
            {['analyse', 'offre_envoyee'].includes(chantier.statut) && (
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: saving ? colors.muted : '#3B82F6' }]}
                onPress={handleEnvoyerOffre}
                disabled={saving}
                activeOpacity={0.8}
              >
                {envoyerOffreMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                    <Text style={styles.btnText}>
                      {chantier.statut === 'offre_envoyee' ? 'Renvoyer l\'offre' : 'Envoyer l\'offre par email'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Confirmer l'accord client (disponible quand offre envoyée) */}
            {chantier.statut === 'offre_envoyee' && (
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: saving ? colors.muted : colors.success }]}
                onPress={handleConfirmerAccord}
                disabled={saving}
                activeOpacity={0.8}
              >
                {confirmerAccordMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />
                    <Text style={styles.btnText}>Confirmer l'accord client</Text>
                  </>
                )}
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
  analyseText: { fontSize: 13, fontWeight: '600', flex: 1 },
  statusBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  statusText: { fontSize: 13, flex: 1 },
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
  actions: { gap: 10, marginTop: 16 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
