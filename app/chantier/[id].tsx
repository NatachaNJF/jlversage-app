import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { STATUT_LABELS, STATUT_COLORS, ChantierStatut } from "@/types";

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: any }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      {icon && <IconSymbol name={icon} size={14} color={colors.muted} />}
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function CheckItem({ label, checked }: { label: string; checked?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.checkItem}>
      <IconSymbol
        name={checked ? "checkmark.circle.fill" : "xmark.circle.fill"}
        size={18}
        color={checked ? colors.success : colors.error}
      />
      <Text style={[styles.checkLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

export default function ChantierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { chantiers, passages, modifierChantier } = useApp();

  const chantier = useMemo(() => chantiers.find(c => c.id === id), [chantiers, id]);
  const passagesChantier = useMemo(() => passages.filter(p => p.chantierId === id), [passages, id]);

  if (!chantier) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={{ color: colors.muted }}>Chantier introuvable</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, marginTop: 12 }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const statutColor = STATUT_COLORS[chantier.statut] || colors.muted;
  const volumeRef = chantier.volumeDeclare || chantier.volumeEstime;
  const pct = volumeRef ? Math.min(100, Math.round((chantier.tonnageAccepte / volumeRef) * 100)) : 0;

  const handleCloture = () => {
    Alert.alert(
      'Clôturer le chantier',
      'Êtes-vous sûr de vouloir clôturer ce chantier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          style: 'destructive',
          onPress: () => modifierChantier(chantier.id, { statut: 'cloture' }),
        },
      ]
    );
  };

  const handleAutoriser = () => {
    Alert.alert(
      'Autoriser le chantier',
      'Confirmer l\'autorisation de livraison au site de Transinne ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Autoriser',
          onPress: () => modifierChantier(chantier.id, {
            statut: 'autorise',
            dateAutorisation: new Date().toISOString(),
          }),
        },
      ]
    );
  };

  const dernierPassages = passagesChantier.slice(0, 5);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          Détail chantier
        </Text>
        <View style={[styles.statutBadge, { backgroundColor: statutColor + '20' }]}>
          <Text style={[styles.statutText, { color: statutColor }]}>
            {STATUT_LABELS[chantier.statut]}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Société */}
        <Section title="Société cliente">
          <InfoRow label="Nom" value={chantier.societe.nom} icon="building.2.fill" />
          <InfoRow label="Adresse" value={chantier.societe.adresse} icon="location.fill" />
          <InfoRow label="TVA" value={chantier.societe.tva} />
          <InfoRow label="Contact" value={chantier.societe.personneContact} icon="person.fill" />
          <InfoRow label="Téléphone" value={chantier.societe.telephone} icon="phone.fill" />
          <InfoRow label="E-mail" value={chantier.societe.mail} icon="envelope.fill" />
        </Section>

        {/* Chantier */}
        <Section title="Informations chantier">
          <InfoRow label="Localisation" value={chantier.localisationChantier} icon="location.fill" />
          <InfoRow label="Contact chantier" value={chantier.contactChantier} icon="person.fill" />
          <InfoRow label="Téléphone chantier" value={chantier.telephoneChantier} icon="phone.fill" />
          <InfoRow label="Classe" value={`Classe ${chantier.classe}`} />
          <InfoRow label="Volume estimé" value={`${chantier.volumeEstime} T`} icon="scalemass.fill" />
          <InfoRow label="Période" value={`${chantier.periodeDebut} → ${chantier.periodeFin}`} icon="calendar" />
        </Section>

        {/* Tonnages */}
        <Section title="Suivi des tonnages">
          <View style={styles.tonnageRow}>
            <View style={styles.tonnageItem}>
              <Text style={[styles.tonnageValue, { color: colors.success }]}>
                {chantier.tonnageAccepte.toFixed(1)} T
              </Text>
              <Text style={[styles.tonnageLabel, { color: colors.muted }]}>Accepté</Text>
            </View>
            <View style={styles.tonnageItem}>
              <Text style={[styles.tonnageValue, { color: colors.error }]}>
                {chantier.tonnageRefuse.toFixed(1)} T
              </Text>
              <Text style={[styles.tonnageLabel, { color: colors.muted }]}>Refusé</Text>
            </View>
            <View style={styles.tonnageItem}>
              <Text style={[styles.tonnageValue, { color: colors.foreground }]}>
                {volumeRef} T
              </Text>
              <Text style={[styles.tonnageLabel, { color: colors.muted }]}>Déclaré</Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, {
              width: `${pct}%` as any,
              backgroundColor: pct >= 90 ? colors.error : colors.primary
            }]} />
          </View>
          <Text style={[styles.pctText, { color: pct >= 90 ? colors.error : colors.primary }]}>
            {pct}% du volume déclaré atteint
          </Text>
        </Section>

        {/* Walterre */}
        {chantier.referenceWalterre && (
          <Section title="Documents Walterre">
            <InfoRow label="Référence" value={chantier.referenceWalterre} />
            <InfoRow label="Régime" value={chantier.regimeApplicable} />
            <InfoRow label="Volume déclaré" value={chantier.volumeDeclare ? `${chantier.volumeDeclare} T` : undefined} />
            <InfoRow label="Transporteurs" value={chantier.transporteurs?.join(', ')} />
            <View style={styles.checkList}>
              <CheckItem label="Certificat de qualité" checked={chantier.certificatQualite} />
              <CheckItem label="Rapport d'analyse" checked={chantier.rapportAnalyse} />
            </View>
          </Section>
        )}

        {/* Validation admin */}
        {(chantier.statut === 'validation_admin' || chantier.statut === 'autorise' || chantier.statut === 'en_cours') && (
          <Section title="Validation administrative">
            <View style={styles.checkList}>
              <CheckItem label="Classe ≤ 2" checked={chantier.validationClasse} />
              <CheckItem label="Certificat valide" checked={chantier.validationCertificat} />
              <CheckItem label="Rapport cohérent" checked={chantier.validationRapport} />
              <CheckItem label="Régime compatible" checked={chantier.validationRegime} />
              <CheckItem label="Volume raisonnable" checked={chantier.validationVolume} />
            </View>
            {chantier.dateAutorisation && (
              <Text style={[styles.autorisationDate, { color: colors.success }]}>
                ✓ Autorisé le {new Date(chantier.dateAutorisation).toLocaleDateString('fr-BE')}
              </Text>
            )}
          </Section>
        )}

        {/* Derniers passages */}
        {dernierPassages.length > 0 && (
          <Section title={`Derniers passages (${passagesChantier.length})`}>
            {dernierPassages.map(p => (
              <View key={p.id} style={[styles.passageRow, { borderBottomColor: colors.border }]}>
                <View style={styles.passageLeft}>
                  <Text style={[styles.passagePlaque, { color: colors.foreground }]}>{p.plaque}</Text>
                  <Text style={[styles.passageMeta, { color: colors.muted }]}>
                    {p.date} {p.heure} — {p.tonnage} T
                  </Text>
                </View>
                <View style={[styles.passageStatut, {
                  backgroundColor: p.accepte ? colors.success + '20' : colors.error + '20'
                }]}>
                  <Text style={{ color: p.accepte ? colors.success : colors.error, fontSize: 12, fontWeight: '600' }}>
                    {p.accepte ? 'Accepté' : 'Refusé'}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {chantier.statut === 'validation_admin' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={handleAutoriser}
              activeOpacity={0.8}
            >
              <IconSymbol name="checkmark.seal.fill" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Autoriser le chantier</Text>
            </TouchableOpacity>
          )}
          {chantier.statut === 'autorise' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/camion/nouveau' as any)}
              activeOpacity={0.8}
            >
              <IconSymbol name="truck.box.fill" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Enregistrer un camion</Text>
            </TouchableOpacity>
          )}
          {chantier.statut === 'documents_demandes' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/chantier/documents/${chantier.id}` as any)}
              activeOpacity={0.8}
            >
              <IconSymbol name="doc.fill" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Saisir les documents</Text>
            </TouchableOpacity>
          )}
          {(chantier.statut === 'en_cours' || chantier.statut === 'volume_atteint') && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error }]}
              onPress={handleCloture}
              activeOpacity={0.8}
            >
              <IconSymbol name="lock.fill" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Clôturer le chantier</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
            onPress={() => router.push(`/chantier/validation/${chantier.id}` as any)}
            activeOpacity={0.8}
          >
            <IconSymbol name="pencil" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>Modifier / Valider</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statutText: { fontSize: 11, fontWeight: '600' },
  scroll: { padding: 16, gap: 12 },
  section: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 1 },
  infoValue: { fontSize: 14 },
  checkList: { gap: 8, marginTop: 4 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkLabel: { fontSize: 14 },
  tonnageRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  tonnageItem: { alignItems: 'center', gap: 4 },
  tonnageValue: { fontSize: 20, fontWeight: '700' },
  tonnageLabel: { fontSize: 11 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  autorisationDate: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  passageRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 0.5,
  },
  passageLeft: { gap: 2 },
  passagePlaque: { fontSize: 14, fontWeight: '600' },
  passageMeta: { fontSize: 12 },
  passageStatut: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  actions: { gap: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  actionBtnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  actionBtnOutlineText: { fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
