import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, TextInput, KeyboardAvoidingView
} from "react-native";
import { showAlert, showConfirm } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

type Etape = "capacite" | "finances";

export default function PreValidationChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const planningQuery = trpc.chantiers.planningGlobal.useQuery();
  const chantier = chantierQuery.data;

  // Étape courante
  const [etape, setEtape] = useState<Etape>("capacite");

  // Étape 1 — Capacité
  const [capaciteOk, setCapaciteOk] = useState<boolean | null>(null);
  const [commentaireRefus, setCommentaireRefus] = useState('');

  // Étape 2 — Finances
  const [financesOk, setFinancesOk] = useState<boolean | null>(null);
  const [commentaireFinances, setCommentaireFinances] = useState('');
  const [prixTonne, setPrixTonne] = useState('');
  const [conditions, setConditions] = useState('Terres conformes Walterre obligatoires. Refus en cas de non-conformité. Facturation sur tonnage accepté.');

  const refuserCapaciteMutation = trpc.chantiers.refuserCapacite.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Refus envoyé', 'Le dossier a été refusé et un email a été envoyé au client.', () => router.back());
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de refuser le dossier.'),
  });

  const envoyerOffreMutation = trpc.chantiers.envoyerOffre.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const msg = financesOk
        ? "L'offre de prix standard a été envoyée par email au client."
        : "L'offre de prix avec condition de paiement au comptant a été envoyée au client.";
      showAlert('Offre envoyée ✅', msg, () => router.back());
    },
    onError: (err: any) => showAlert('Erreur', err.message || "Impossible d'envoyer l'offre."),
  });

  const saving = refuserCapaciteMutation.isPending || envoyerOffreMutation.isPending;

  if (chantierQuery.isLoading || planningQuery.isLoading) {
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

  // Planning global : jours déjà occupés sur la période du chantier
  const planning = planningQuery.data ?? [];
  const joursOccupes = planning.filter(j => {
    if (!chantier.periodeDebut || !chantier.periodeFin) return false;
    return j.date >= chantier.periodeDebut && j.date <= chantier.periodeFin;
  });
  const totalTonnagePrev = joursOccupes.reduce((s, j) => s + j.tonnagePrev, 0);

  const handleRefuserCapacite = () => {
    showConfirm(
      'Refuser pour capacité insuffisante',
      'Un email de refus sera envoyé au client. Cette action est irréversible.',
      () => refuserCapaciteMutation.mutate({ id: Number(id), commentaire: commentaireRefus.trim() || undefined }),
      'Confirmer le refus',
      true,
    );
  };

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
    const typeOffre = financesOk ? 'standard' : 'avec paiement au comptant';
    showConfirm(
      'Envoyer l\'offre de prix',
      `Une offre ${typeOffre} sera envoyée par email au client (${prix.toFixed(2)} €/T).`,
      () => envoyerOffreMutation.mutate({
        id: Number(id),
        prixTonne: prix,
        conditionsAcceptation: conditions.trim(),
        paiementComptant: !financesOk,
      }),
      'Envoyer l\'offre',
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analyse du dossier</Text>
        </View>

        {/* Indicateur d'étapes */}
        <View style={[styles.stepsBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.stepItem, etape === 'capacite' && styles.stepItemActive]}
            onPress={() => setEtape('capacite')}
          >
            <View style={[styles.stepDot, { backgroundColor: etape === 'capacite' ? colors.primary : (capaciteOk !== null ? colors.success : colors.border) }]}>
              {capaciteOk !== null && etape !== 'capacite'
                ? <IconSymbol name="checkmark" size={12} color="#fff" />
                : <Text style={styles.stepNum}>1</Text>
              }
            </View>
            <Text style={[styles.stepLabel, { color: etape === 'capacite' ? colors.primary : colors.muted }]}>Capacité</Text>
          </TouchableOpacity>
          <View style={[styles.stepLine, { backgroundColor: capaciteOk === true ? colors.success : colors.border }]} />
          <TouchableOpacity
            style={[styles.stepItem, etape === 'finances' && styles.stepItemActive]}
            onPress={() => { if (capaciteOk === true) setEtape('finances'); }}
            disabled={capaciteOk !== true}
          >
            <View style={[styles.stepDot, { backgroundColor: etape === 'finances' ? colors.primary : colors.border, opacity: capaciteOk === true ? 1 : 0.4 }]}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <Text style={[styles.stepLabel, { color: etape === 'finances' ? colors.primary : colors.muted, opacity: capaciteOk === true ? 1 : 0.4 }]}>Finances</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Récap chantier */}
          <View style={[styles.recapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.recapNom, { color: colors.foreground }]}>{chantier.societeNom}</Text>
            <Text style={[styles.recapInfo, { color: colors.muted }]}>
              {chantier.localisationChantier} · Classe {chantier.classe} · {Number(chantier.volumeEstime).toFixed(0)} T
            </Text>
            {chantier.periodeDebut && chantier.periodeFin && (
              <Text style={[styles.recapInfo, { color: colors.muted }]}>
                Période : {chantier.periodeDebut} → {chantier.periodeFin}
              </Text>
            )}
          </View>

          {/* ─── ÉTAPE 1 : CAPACITÉ DE VERSAGE ─── */}
          {etape === 'capacite' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Étape 1 — Capacité de versage</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                Vérifiez si le planning de versage permet d'accepter ce chantier sur la période demandée.
              </Text>

              {/* Planning des versages prévus sur la période */}
              <View style={[styles.planningCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.planningHeader}>
                  <IconSymbol name="calendar" size={18} color={colors.primary} />
                  <Text style={[styles.planningTitle, { color: colors.foreground }]}>
                    Versages déjà prévus sur la période
                  </Text>
                </View>
                {joursOccupes.length === 0 ? (
                  <View style={[styles.planningEmpty, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                    <Text style={[styles.planningEmptyText, { color: colors.success }]}>
                      Aucun versage prévu sur cette période — capacité disponible
                    </Text>
                  </View>
                ) : (
                  <>
                    {joursOccupes.slice(0, 8).map(j => (
                      <View key={j.date} style={[styles.planningRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.planningDate, { color: colors.foreground }]}>{j.date}</Text>
                        <Text style={[styles.planningTonnage, { color: colors.muted }]}>{j.tonnagePrev.toFixed(0)} T prévus</Text>
                        <Text style={[styles.planningChantiers, { color: colors.muted }]} numberOfLines={1}>
                          {j.chantiers.join(', ')}
                        </Text>
                      </View>
                    ))}
                    {joursOccupes.length > 8 && (
                      <Text style={[styles.planningMore, { color: colors.muted }]}>
                        + {joursOccupes.length - 8} autres jours...
                      </Text>
                    )}
                    <View style={[styles.planningTotal, { borderTopColor: colors.border }]}>
                      <Text style={[styles.planningTotalLabel, { color: colors.foreground }]}>Total prévu sur la période</Text>
                      <Text style={[styles.planningTotalVal, { color: colors.primary }]}>{totalTonnagePrev.toFixed(0)} T</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Commentaire optionnel (si refus) */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Commentaire (optionnel)</Text>
                <TextInput
                  style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={commentaireRefus}
                  onChangeText={setCommentaireRefus}
                  placeholder="Précision sur la capacité disponible, période alternative possible..."
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>

              {/* Boutons de décision */}
              <View style={styles.decisionRow}>
                <TouchableOpacity
                  style={[styles.btnRefus, { borderColor: colors.error, opacity: saving ? 0.6 : 1 }]}
                  onPress={handleRefuserCapacite}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {refuserCapaciteMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
                      <Text style={[styles.btnRefusText, { color: colors.error }]}>Refuser — Planning complet</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnValider, { backgroundColor: colors.success, opacity: saving ? 0.6 : 1 }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCapaciteOk(true);
                    setEtape('finances');
                  }}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />
                  <Text style={styles.btnValiderText}>Capacité OK → Étape 2</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─── ÉTAPE 2 : ANALYSE FINANCIÈRE ─── */}
          {etape === 'finances' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Étape 2 — Analyse financière</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                Vérifiez la situation financière du client. Le résultat détermine les conditions de paiement dans l'offre.
              </Text>

              {/* Choix finances saines / non saines */}
              <TouchableOpacity
                style={[styles.checkCard, {
                  backgroundColor: colors.surface,
                  borderColor: financesOk === true ? colors.success : colors.border,
                  borderWidth: financesOk === true ? 2 : 1,
                }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFinancesOk(true);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.checkBox, {
                  backgroundColor: financesOk === true ? colors.success : 'transparent',
                  borderColor: financesOk === true ? colors.success : colors.muted,
                }]}>
                  {financesOk === true && <IconSymbol name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.checkContent}>
                  <View style={styles.checkTitleRow}>
                    <IconSymbol name="eurosign.circle.fill" size={18} color={financesOk === true ? colors.success : colors.muted} />
                    <Text style={[styles.checkTitle, { color: financesOk === true ? colors.success : colors.foreground }]}>
                      Finances saines
                    </Text>
                  </View>
                  <Text style={[styles.checkDesc, { color: colors.muted }]}>
                    Aucun impayé — offre de prix standard avec facturation habituelle.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkCard, {
                  backgroundColor: colors.surface,
                  borderColor: financesOk === false ? colors.warning : colors.border,
                  borderWidth: financesOk === false ? 2 : 1,
                }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFinancesOk(false);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.checkBox, {
                  backgroundColor: financesOk === false ? colors.warning : 'transparent',
                  borderColor: financesOk === false ? colors.warning : colors.muted,
                }]}>
                  {financesOk === false && <IconSymbol name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.checkContent}>
                  <View style={styles.checkTitleRow}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color={financesOk === false ? colors.warning : colors.muted} />
                    <Text style={[styles.checkTitle, { color: financesOk === false ? colors.warning : colors.foreground }]}>
                      Finances non saines
                    </Text>
                  </View>
                  <Text style={[styles.checkDesc, { color: colors.muted }]}>
                    Impayés ou risque financier — offre avec paiement au comptant à chaque versage.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Commentaire finances */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Commentaire financier (optionnel)</Text>
                <TextInput
                  style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={commentaireFinances}
                  onChangeText={setCommentaireFinances}
                  placeholder="Observations sur la situation financière du client..."
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>

              {/* Prix à la tonne */}
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

              {/* Conditions d'acceptation */}
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

              {/* Bannière type d'offre */}
              {financesOk !== null && (
                <View style={[styles.offreBanner, {
                  backgroundColor: financesOk ? colors.success + '15' : colors.warning + '15',
                  borderColor: financesOk ? colors.success : colors.warning,
                }]}>
                  <IconSymbol
                    name={financesOk ? "paperplane.fill" : "exclamationmark.triangle.fill"}
                    size={16}
                    color={financesOk ? colors.success : colors.warning}
                  />
                  <Text style={[styles.offreBannerText, { color: financesOk ? colors.success : colors.warning }]}>
                    {financesOk
                      ? "Offre standard — facturation habituelle"
                      : "Offre avec paiement au comptant à chaque versage"
                    }
                  </Text>
                </View>
              )}

              {/* Boutons */}
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  style={[styles.btnRetour, { borderColor: colors.border }]}
                  onPress={() => setEtape('capacite')}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <IconSymbol name="chevron.left" size={16} color={colors.muted} />
                  <Text style={[styles.btnRetourText, { color: colors.muted }]}>Retour étape 1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnEnvoyer, {
                    backgroundColor: financesOk !== null ? colors.primary : colors.muted,
                    opacity: saving ? 0.7 : 1,
                  }]}
                  onPress={handleEnvoyerOffre}
                  disabled={saving || financesOk === null}
                  activeOpacity={0.8}
                >
                  {envoyerOffreMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                      <Text style={styles.btnEnvoyerText}>Envoyer l'offre de prix</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
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
  stepsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 24, gap: 0, borderBottomWidth: 0.5,
  },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepItemActive: {},
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepLine: { height: 2, flex: 0.5, marginBottom: 18 },
  stepLabel: { fontSize: 12, fontWeight: '500' },
  scroll: { padding: 16, gap: 12 },
  recapCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  recapNom: { fontSize: 15, fontWeight: '700' },
  recapInfo: { fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  planningCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  planningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planningTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  planningEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1,
  },
  planningEmptyText: { fontSize: 13, fontWeight: '500', flex: 1 },
  planningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, borderBottomWidth: 0.5,
  },
  planningDate: { fontSize: 13, fontWeight: '600', width: 90 },
  planningTonnage: { fontSize: 13, width: 80 },
  planningChantiers: { fontSize: 12, flex: 1 },
  planningMore: { fontSize: 12, textAlign: 'center', paddingTop: 4 },
  planningTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 0.5, marginTop: 4,
  },
  planningTotalLabel: { fontSize: 13, fontWeight: '600' },
  planningTotalVal: { fontSize: 15, fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  textarea: {
    borderRadius: 10, borderWidth: 1, padding: 12,
    fontSize: 14, minHeight: 72, textAlignVertical: 'top',
  },
  inputLarge: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 20, fontWeight: '700', textAlign: 'center',
  },
  estimation: { fontSize: 12, textAlign: 'center' },
  decisionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnRefus: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  btnRefusText: { fontSize: 13, fontWeight: '600' },
  btnValider: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  btnValiderText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkCard: {
    borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
  },
  checkBox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  checkContent: { flex: 1, gap: 6 },
  checkTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  checkDesc: { fontSize: 13, lineHeight: 18 },
  offreBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1.5,
  },
  offreBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  actionsCol: { gap: 10, marginTop: 4 },
  btnRetour: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  btnRetourText: { fontSize: 14 },
  btnEnvoyer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  btnEnvoyerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
