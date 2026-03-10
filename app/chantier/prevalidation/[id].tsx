import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform
} from "react-native";
import { showAlert, showConfirm } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function PreValidationChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const chantier = chantierQuery.data;

  const autoriserMutation = trpc.chantiers.autoriser.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showAlert(
        'Chantier autorisé ✅',
        'Le chantier est maintenant autorisé. Un email a été envoyé au client avec sa référence Walterre.',
        () => router.back()
      );
    },
    onError: (err: any) => showAlert('Erreur', err.message || "Impossible d'autoriser le chantier."),
  });

  // Cases à cocher pré-validation
  const [timingOk, setTimingOk] = useState(false);
  const [financesOk, setFinancesOk] = useState(false);

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

  const toutOk = timingOk && financesOk;
  const saving = autoriserMutation.isPending;

  const handleToggleTiming = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimingOk(v => !v);
  };

  const handleToggleFinances = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFinancesOk(v => !v);
  };

  const handleAutoriser = () => {
    if (!toutOk) {
      showAlert('Vérification requise', 'Veuillez confirmer les deux points de contrôle avant d\'autoriser le chantier.');
      return;
    }
    showConfirm(
      'Autoriser le chantier',
      'Autoriser définitivement ce chantier ? Un email sera envoyé au client.',
      () => autoriserMutation.mutate({ id: Number(id) }),
      'Autoriser'
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Pré-validation</Text>
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
          {chantier.periodeDebut && chantier.periodeFin && (
            <View style={styles.recapDateRow}>
              <IconSymbol name="calendar" size={14} color={colors.muted} />
              <Text style={[styles.recapInfo, { color: colors.muted }]}>
                {chantier.periodeDebut} → {chantier.periodeFin}
              </Text>
            </View>
          )}
          {chantier.volumeDeclare && (
            <Text style={[styles.recapInfo, { color: colors.muted }]}>
              Volume : {Number(chantier.volumeDeclare).toFixed(0)} T déclarés
            </Text>
          )}
        </View>

        {/* Titre section */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Points de contrôle avant autorisation</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
          Cochez les deux points ci-dessous pour confirmer que le chantier est prêt à être autorisé.
        </Text>

        {/* Case 1 : Timing de versage */}
        <TouchableOpacity
          style={[
            styles.checkCard,
            {
              backgroundColor: colors.surface,
              borderColor: timingOk ? colors.success : colors.border,
              borderWidth: timingOk ? 2 : 1,
            }
          ]}
          onPress={handleToggleTiming}
          activeOpacity={0.8}
        >
          <View style={[
            styles.checkBox,
            {
              backgroundColor: timingOk ? colors.success : 'transparent',
              borderColor: timingOk ? colors.success : colors.muted,
            }
          ]}>
            {timingOk && <IconSymbol name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.checkContent}>
            <View style={styles.checkTitleRow}>
              <IconSymbol name="clock.fill" size={18} color={timingOk ? colors.success : colors.muted} />
              <Text style={[styles.checkTitle, { color: timingOk ? colors.success : colors.foreground }]}>
                Timing de versage : OK
              </Text>
            </View>
            <Text style={[styles.checkDesc, { color: colors.muted }]}>
              La période de versage ({chantier.periodeDebut || '—'} → {chantier.periodeFin || '—'}) est compatible avec la capacité disponible du site.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Case 2 : Finances saines */}
        <TouchableOpacity
          style={[
            styles.checkCard,
            {
              backgroundColor: colors.surface,
              borderColor: financesOk ? colors.success : colors.border,
              borderWidth: financesOk ? 2 : 1,
            }
          ]}
          onPress={handleToggleFinances}
          activeOpacity={0.8}
        >
          <View style={[
            styles.checkBox,
            {
              backgroundColor: financesOk ? colors.success : 'transparent',
              borderColor: financesOk ? colors.success : colors.muted,
            }
          ]}>
            {financesOk && <IconSymbol name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.checkContent}>
            <View style={styles.checkTitleRow}>
              <IconSymbol name="eurosign.circle.fill" size={18} color={financesOk ? colors.success : colors.muted} />
              <Text style={[styles.checkTitle, { color: financesOk ? colors.success : colors.foreground }]}>
                Finances saines
              </Text>
            </View>
            <Text style={[styles.checkDesc, { color: colors.muted }]}>
              {financesOk
                ? 'Aucun paiement spécial requis.'
                : 'Vérifiez la situation financière du client. Si des impayés existent, le paiement au versage sera réclamé au chauffeur à chaque passage.'}
            </Text>
            {!financesOk && (
              <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  Si finances non saines : cochez quand même pour confirmer que vous avez vérifié — le paiement au versage sera réclamé au chauffeur.
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Alerte paiement au versage si finances non saines */}
        {financesOk === false && (
          <View style={[styles.alertCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.warning }]}>Rappel : paiement au versage</Text>
              <Text style={[styles.alertDesc, { color: colors.foreground }]}>
                Si les finances du client ne sont pas saines, le préposé devra réclamer le paiement au chauffeur à chaque passage avant d'enregistrer le tonnage.
              </Text>
            </View>
          </View>
        )}

        {/* Bannière tout OK */}
        {toutOk && (
          <View style={[styles.successBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
            <IconSymbol name="checkmark.seal.fill" size={20} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>
              Les deux points sont confirmés — vous pouvez autoriser le chantier.
            </Text>
          </View>
        )}

        {/* Bouton autoriser */}
        <TouchableOpacity
          style={[
            styles.btnAutoriser,
            {
              backgroundColor: toutOk ? colors.success : colors.muted,
              opacity: saving ? 0.7 : 1,
            }
          ]}
          onPress={handleAutoriser}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <IconSymbol name="checkmark.seal.fill" size={20} color="#fff" />
              <Text style={styles.btnText}>Autoriser le chantier</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnAnnuler, { borderColor: colors.border }]}
          onPress={() => router.back()}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnAnnulerText, { color: colors.muted }]}>Annuler</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scroll: { padding: 16, gap: 12 },
  recapCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 4,
  },
  recapNom: { fontSize: 15, fontWeight: '700' },
  recapInfo: { fontSize: 13 },
  recapRef: { fontSize: 13, fontWeight: '600' },
  recapDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
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
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 4,
  },
  warningText: { flex: 1, fontSize: 12, lineHeight: 16 },
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  alertDesc: { fontSize: 13, lineHeight: 18 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  successText: { flex: 1, fontSize: 14, fontWeight: '600' },
  btnAutoriser: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnAnnuler: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  btnAnnulerText: { fontSize: 15, fontWeight: '500' },
});
