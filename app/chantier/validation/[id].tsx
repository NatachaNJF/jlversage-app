import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { showAlert, showConfirm } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function ValidationChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const chantier = chantierQuery.data;

  const validerMutation = trpc.chantiers.validerAdmin.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Validation enregistrée', 'Les critères de validation ont été enregistrés.');
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de sauvegarder.'),
  });

  const autoriserMutation = trpc.chantiers.autoriser.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Chantier autorisé', 'Le chantier est maintenant autorisé à livrer au site de Transinne. Un email a été envoyé au client.');
      router.back();
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible d\'autoriser le chantier.'),
  });

  const refuserMutation = trpc.chantiers.refuserAdmin.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Chantier refusé', 'Le chantier a été refusé. Un email a été envoyé au client.');
      router.back();
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de refuser le chantier.'),
  });

  const [valClasse, setValClasse] = useState(false);
  const [valCertif, setValCertif] = useState(false);
  const [valRapport, setValRapport] = useState(false);
  const [valRegime, setValRegime] = useState(false);
  const [valVolume, setValVolume] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (chantier && !initialized) {
    setValClasse(!!chantier.validationClasse);
    setValCertif(!!chantier.validationCertificat);
    setValRapport(!!chantier.validationRapport);
    setValRegime(!!chantier.validationRegime);
    setValVolume(!!chantier.validationVolume);
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

  const toutValide = valClasse && valCertif && valRapport && valRegime && valVolume;
  const saving = validerMutation.isPending || autoriserMutation.isPending || refuserMutation.isPending;

  const handleSaveValidation = () => {
    validerMutation.mutate({
      id: Number(id),
      validationClasse: valClasse,
      validationCertificat: valCertif,
      validationRapport: valRapport,
      validationRegime: valRegime,
      validationVolume: valVolume,
    });
  };

  const handleAutoriser = () => {
    showConfirm(
      'Autoriser le chantier',
      'Autoriser définitivement ce chantier ? Un email sera envoyé au client.',
      () => autoriserMutation.mutate({ id: Number(id) }),
      'Autoriser'
    );
  };

  const handleRefuser = () => {
    const motif = window.prompt?.('Motif du refus (minimum 10 caractères) :') || '';
    if (!motif.trim() || motif.trim().length < 10) {
      showAlert('Motif requis', 'Veuillez indiquer un motif de refus (minimum 10 caractères).');
      return;
    }
    refuserMutation.mutate({ id: Number(id), motif: motif.trim() });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Validation administrative</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Récap chantier */}
          <View style={[styles.recapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.recapNom, { color: colors.foreground }]}>{chantier.societeNom}</Text>
            <Text style={[styles.recapInfo, { color: colors.muted }]}>
              {chantier.localisationChantier} · Classe {chantier.classe}
            </Text>
            {chantier.referenceWalterre && (
              <Text style={[styles.recapRef, { color: colors.primary }]}>
                Réf. Walterre : {chantier.referenceWalterre}
              </Text>
            )}
            {chantier.prixTonne && (
              <Text style={[styles.recapInfo, { color: colors.muted }]}>
                Prix : {Number(chantier.prixTonne).toFixed(2)} €/T · {Number(chantier.volumeDeclare || chantier.volumeEstime).toFixed(0)} T déclarés
              </Text>
            )}
          </View>

          {/* Documents reçus */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents reçus</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.docRow}>
              <IconSymbol
                name={chantier.certificatQualite ? "checkmark.circle.fill" : "xmark.circle.fill"}
                size={18}
                color={chantier.certificatQualite ? colors.success : colors.error}
              />
              <Text style={[styles.docLabel, { color: colors.foreground }]}>Certificat de qualité des terres</Text>
            </View>
            <View style={styles.docRow}>
              <IconSymbol
                name={chantier.rapportAnalyse ? "checkmark.circle.fill" : "xmark.circle.fill"}
                size={18}
                color={chantier.rapportAnalyse ? colors.success : colors.error}
              />
              <Text style={[styles.docLabel, { color: colors.foreground }]}>Rapport d'analyse</Text>
            </View>
            {chantier.regimeApplicable && (
              <Text style={[styles.docHint, { color: colors.muted }]}>Régime : {chantier.regimeApplicable}</Text>
            )}
            {chantier.transporteurs && (
              <Text style={[styles.docHint, { color: colors.muted }]}>
                Transporteurs : {Array.isArray(chantier.transporteurs) ? chantier.transporteurs.join(', ') : chantier.transporteurs}
              </Text>
            )}
          </View>

          {/* Validation administrative */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Critères de validation</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Classe ≤ 2 vérifiée</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>Classe {chantier.classe} déclarée</Text>
              </View>
              <Switch value={valClasse} onValueChange={setValClasse} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Certificat valide</Text>
              <Switch value={valCertif} onValueChange={setValCertif} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Rapport cohérent</Text>
              <Switch value={valRapport} onValueChange={setValRapport} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Régime compatible</Text>
              <Switch value={valRegime} onValueChange={setValRegime} trackColor={{ true: colors.success }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>Volume raisonnable</Text>
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
              style={[styles.btnSave, { backgroundColor: saving ? colors.muted : colors.primary }]}
              onPress={handleSaveValidation}
              disabled={saving}
              activeOpacity={0.8}
            >
              {validerMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>Enregistrer la validation</Text>
              )}
            </TouchableOpacity>

            {toutValide && (
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: saving ? colors.muted : colors.success }]}
                onPress={handleAutoriser}
                disabled={saving}
                activeOpacity={0.8}
              >
                {autoriserMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.seal.fill" size={18} color="#fff" />
                    <Text style={styles.btnText}>Autoriser le chantier</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btnRefus, { borderColor: colors.error }]}
              onPress={handleRefuser}
              disabled={saving}
              activeOpacity={0.8}
            >
              {refuserMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={[styles.btnRefusText, { color: colors.error }]}>Refuser le dossier</Text>
              )}
            </TouchableOpacity>
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
  recapRef: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12, marginBottom: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docLabel: { fontSize: 14 },
  docHint: { fontSize: 12, marginTop: 4 },
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
  btnRefus: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  btnRefusText: { fontSize: 15, fontWeight: '600' },
});
