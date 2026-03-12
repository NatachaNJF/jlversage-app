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
  const fermeturesQuery = trpc.fermetures.list.useQuery();
  const chantier = chantierQuery.data;

  // Étape courante
  const [etape, setEtape] = useState<Etape>("capacite");

  // Étape 1 — Capacité
  const [capaciteOk, setCapaciteOk] = useState<boolean | null>(null);
  const [commentaireRefus, setCommentaireRefus] = useState('');

  // Étape 2 — Finances
  const [financesOk, setFinancesOk] = useState<boolean | null>(null);
  const [commentaireAnalyse, setCommentaireAnalyse] = useState('');
  const [offreOdoo, setOffreOdoo] = useState(false);
  const [dateOffreOdoo, setDateOffreOdoo] = useState(new Date().toISOString().split('T')[0]);

  const refuserCapaciteMutation = trpc.chantiers.refuserCapacite.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Dossier refusé', 'Le dossier a été refusé pour capacité insuffisante.', () => router.back());
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de refuser le dossier.'),
  });

  const terminerAnalyseMutation = trpc.chantiers.terminerAnalyse.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Analyse terminée ✅', 'Le dossier est passé en statut "Offre envoyée".', () => router.back());
    },
    onError: (err: any) => showAlert('Erreur', err.message || "Impossible de terminer l'analyse."),
  });

  const saving = refuserCapaciteMutation.isPending || terminerAnalyseMutation.isPending;

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
  // Générer la liste de tous les jours fermés (dateDebut → dateFin)
  const fermetures: string[] = [];
  for (const f of (fermeturesQuery.data ?? [])) {
    const start = new Date(f.dateDebut);
    const end = new Date(f.dateFin);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      fermetures.push(d.toISOString().split('T')[0]);
    }
  }

  const joursOccupes = planning.filter(j => {
    if (!chantier.periodeDebut || !chantier.periodeFin) return false;
    return j.date >= chantier.periodeDebut && j.date <= chantier.periodeFin;
  });
  const totalTonnagePrev = joursOccupes.reduce((s, j) => s + j.tonnagePrev, 0);

  // Jours fermés sur la période
  const joursFermes = fermetures.filter(d =>
    chantier.periodeDebut && chantier.periodeFin &&
    d >= chantier.periodeDebut && d <= chantier.periodeFin
  );

  const handleRefuserCapacite = () => {
    showConfirm(
      'Refuser pour capacité insuffisante',
      'Le dossier sera refusé. Cette action est irréversible.',
      () => refuserCapaciteMutation.mutate({ id: Number(id), commentaire: commentaireRefus.trim() || undefined }),
      'Confirmer le refus',
      true,
    );
  };

  const handleTerminerAnalyse = () => {
    if (financesOk === null) {
      showAlert('Situation financière requise', 'Veuillez indiquer si les finances du client sont saines ou non.');
      return;
    }
    showConfirm(
      'Terminer l\'analyse',
      `Le dossier passera en statut "Offre envoyée"${offreOdoo ? ' — offre Odoo enregistrée.' : '.'}`,
      () => terminerAnalyseMutation.mutate({
        id: Number(id),
        financesOk,
        commentaireAnalyse: commentaireAnalyse.trim() || undefined,
        offreOdoo,
        dateOffreOdoo: offreOdoo ? dateOffreOdoo : undefined,
      }),
      'Terminer l\'analyse',
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* En-tête */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analyse du dossier</Text>
        </View>

        {/* Indicateur d'étapes */}
        <View style={[styles.stepsBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.stepItem}
            onPress={() => setEtape('capacite')}
          >
            <View style={[styles.stepDot, {
              backgroundColor: etape === 'capacite'
                ? colors.primary
                : capaciteOk === true ? colors.success : colors.border
            }]}>
              {capaciteOk === true && etape !== 'capacite'
                ? <IconSymbol name="checkmark" size={12} color="#fff" />
                : <Text style={styles.stepNum}>1</Text>
              }
            </View>
            <Text style={[styles.stepLabel, { color: etape === 'capacite' ? colors.primary : colors.muted }]}>
              Capacité
            </Text>
          </TouchableOpacity>

          <View style={[styles.stepLine, { backgroundColor: capaciteOk === true ? colors.success : colors.border }]} />

          <TouchableOpacity
            style={styles.stepItem}
            onPress={() => { if (capaciteOk === true) setEtape('finances'); }}
            disabled={capaciteOk !== true}
          >
            <View style={[styles.stepDot, {
              backgroundColor: etape === 'finances' ? colors.primary : colors.border,
              opacity: capaciteOk === true ? 1 : 0.4,
            }]}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <Text style={[styles.stepLabel, {
              color: etape === 'finances' ? colors.primary : colors.muted,
              opacity: capaciteOk === true ? 1 : 0.4,
            }]}>
              Finances & Offre
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* ─── ÉTAPE 1 : CAPACITÉ ─── */}
          {etape === 'capacite' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Étape 1 — Capacité de versage
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                Vérifiez si le planning permet d'accepter ce chantier sur la période demandée.
              </Text>

              {/* Jours fermés sur la période */}
              {joursFermes.length > 0 && (
                <View style={[styles.alertCard, { backgroundColor: colors.warning + '18', borderColor: colors.warning }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: colors.warning }]}>
                      {joursFermes.length} jour{joursFermes.length > 1 ? 's' : ''} de fermeture sur la période
                    </Text>
                    <Text style={[styles.alertDates, { color: colors.muted }]}>
                      {joursFermes.slice(0, 5).join(' · ')}{joursFermes.length > 5 ? ` + ${joursFermes.length - 5} autres` : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Planning des versages prévus */}
              <View style={[styles.planningCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.planningHeader}>
                  <IconSymbol name="calendar" size={18} color={colors.primary} />
                  <Text style={[styles.planningTitle, { color: colors.foreground }]}>
                    Versages déjà prévus sur la période
                  </Text>
                </View>

                {joursOccupes.length === 0 ? (
                  <View style={[styles.emptyBadge, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                    <Text style={[styles.emptyBadgeText, { color: colors.success }]}>
                      Aucun versage prévu — capacité disponible
                    </Text>
                  </View>
                ) : (
                  <>
                    {joursOccupes.slice(0, 8).map(j => (
                      <View key={j.date} style={[styles.planningRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.planningDate, { color: colors.foreground }]}>{j.date}</Text>
                        <Text style={[styles.planningTonnage, { color: colors.muted }]}>
                          {j.tonnagePrev.toFixed(0)} T
                        </Text>
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
                      <Text style={[styles.planningTotalLabel, { color: colors.foreground }]}>
                        Total prévu sur la période
                      </Text>
                      <Text style={[styles.planningTotalVal, { color: colors.primary }]}>
                        {totalTonnagePrev.toFixed(0)} T
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Commentaire optionnel */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Commentaire (optionnel — affiché en cas de refus)
                </Text>
                <TextInput
                  style={[styles.textarea, {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  value={commentaireRefus}
                  onChangeText={setCommentaireRefus}
                  placeholder="Période alternative possible, remarques..."
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
                      <Text style={[styles.btnRefusText, { color: colors.error }]}>
                        Refuser — Capacité insuffisante
                      </Text>
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

          {/* ─── ÉTAPE 2 : FINANCES & OFFRE ODOO ─── */}
          {etape === 'finances' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Étape 2 — Finances & Offre de prix
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                Vérifiez la situation financière du client, puis enregistrez l'envoi de l'offre dans Odoo.
              </Text>

              {/* Situation financière */}
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                Situation financière du client
              </Text>

              <TouchableOpacity
                style={[styles.choiceCard, {
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
                <View style={[styles.radio, {
                  backgroundColor: financesOk === true ? colors.success : 'transparent',
                  borderColor: financesOk === true ? colors.success : colors.muted,
                }]}>
                  {financesOk === true && <IconSymbol name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={styles.choiceContent}>
                  <View style={styles.choiceTitleRow}>
                    <IconSymbol name="eurosign.circle.fill" size={18}
                      color={financesOk === true ? colors.success : colors.muted} />
                    <Text style={[styles.choiceTitle, {
                      color: financesOk === true ? colors.success : colors.foreground,
                    }]}>
                      Finances saines
                    </Text>
                  </View>
                  <Text style={[styles.choiceDesc, { color: colors.muted }]}>
                    Aucun impayé — conditions de paiement standard.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceCard, {
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
                <View style={[styles.radio, {
                  backgroundColor: financesOk === false ? colors.warning : 'transparent',
                  borderColor: financesOk === false ? colors.warning : colors.muted,
                }]}>
                  {financesOk === false && <IconSymbol name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={styles.choiceContent}>
                  <View style={styles.choiceTitleRow}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={18}
                      color={financesOk === false ? colors.warning : colors.muted} />
                    <Text style={[styles.choiceTitle, {
                      color: financesOk === false ? colors.warning : colors.foreground,
                    }]}>
                      Finances non saines
                    </Text>
                  </View>
                  <Text style={[styles.choiceDesc, { color: colors.muted }]}>
                    Impayés ou risque financier — paiement au comptant à chaque versage.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Commentaire analyse */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Commentaire (optionnel)
                </Text>
                <TextInput
                  style={[styles.textarea, {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  value={commentaireAnalyse}
                  onChangeText={setCommentaireAnalyse}
                  placeholder="Observations sur la situation financière..."
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>

              {/* ─── Case à cocher : Offre Odoo ─── */}
              <View style={[styles.odooSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.odooSectionTitle, { color: colors.foreground }]}>
                  Offre de prix Odoo
                </Text>
                <Text style={[styles.odooSectionDesc, { color: colors.muted }]}>
                  Cochez si l'offre de prix a été envoyée au client depuis Odoo.
                </Text>

                <TouchableOpacity
                  style={[styles.odooCheckRow]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOffreOdoo(v => !v);
                    if (!offreOdoo) {
                      setDateOffreOdoo(new Date().toISOString().split('T')[0]);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, {
                    backgroundColor: offreOdoo ? colors.primary : 'transparent',
                    borderColor: offreOdoo ? colors.primary : colors.muted,
                  }]}>
                    {offreOdoo && <IconSymbol name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.odooCheckLabel, { color: offreOdoo ? colors.primary : colors.foreground }]}>
                    Offre de prix envoyée dans Odoo
                  </Text>
                </TouchableOpacity>

                {offreOdoo && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.muted }]}>Date d'envoi</Text>
                    <TextInput
                      style={[styles.inputDate, {
                        color: colors.foreground,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      }]}
                      value={dateOffreOdoo}
                      onChangeText={setDateOffreOdoo}
                      placeholder="AAAA-MM-JJ"
                      placeholderTextColor={colors.muted}
                      returnKeyType="done"
                    />
                  </View>
                )}
              </View>

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
                  style={[styles.btnTerminer, {
                    backgroundColor: financesOk !== null ? colors.primary : colors.muted,
                    opacity: saving ? 0.7 : 1,
                  }]}
                  onPress={handleTerminerAnalyse}
                  disabled={saving || financesOk === null}
                  activeOpacity={0.8}
                >
                  {terminerAnalyseMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />
                      <Text style={styles.btnTerminerText}>Terminer l'analyse</Text>
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
    paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 0.5,
  },
  stepItem: { alignItems: 'center', gap: 4, flex: 1 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepLabel: { fontSize: 12, fontWeight: '500' },
  stepLine: { height: 2, flex: 1, marginHorizontal: 4, borderRadius: 1 },

  scroll: { padding: 16, gap: 12 },

  recapCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 4,
  },
  recapNom: { fontSize: 15, fontWeight: '600' },
  recapInfo: { fontSize: 13 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 4 },

  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  alertTitle: { fontSize: 13, fontWeight: '600' },
  alertDates: { fontSize: 12, marginTop: 2 },

  planningCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 8,
  },
  planningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planningTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  planningRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 0.5, gap: 8,
  },
  planningDate: { fontSize: 13, fontWeight: '500', width: 90 },
  planningTonnage: { fontSize: 13, width: 55 },
  planningChantiers: { fontSize: 12, flex: 1 },
  planningMore: { fontSize: 12, textAlign: 'center', paddingTop: 4 },
  planningTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 0.5,
  },
  planningTotalLabel: { fontSize: 13, fontWeight: '600' },
  planningTotalVal: { fontSize: 15, fontWeight: '700' },

  emptyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, borderWidth: 1, padding: 10,
  },
  emptyBadgeText: { fontSize: 13, fontWeight: '500', flex: 1 },

  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '500' },
  textarea: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 14, minHeight: 80,
  },
  inputDate: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 14, height: 44,
  },

  decisionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnRefus: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10,
  },
  btnRefusText: { fontSize: 13, fontWeight: '600', textAlign: 'center', flex: 1 },
  btnValider: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10,
  },
  btnValiderText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  choiceCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 12, padding: 14,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  choiceContent: { flex: 1, gap: 3 },
  choiceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  choiceTitle: { fontSize: 14, fontWeight: '600' },
  choiceDesc: { fontSize: 12, lineHeight: 17 },

  odooSection: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginTop: 4,
  },
  odooSectionTitle: { fontSize: 14, fontWeight: '700' },
  odooSectionDesc: { fontSize: 12, lineHeight: 17 },
  odooCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  odooCheckLabel: { fontSize: 14, fontWeight: '600', flex: 1 },

  actionsCol: { gap: 10, marginTop: 8 },
  btnRetour: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 11,
  },
  btnRetourText: { fontSize: 14, fontWeight: '500' },
  btnTerminer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  btnTerminerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
