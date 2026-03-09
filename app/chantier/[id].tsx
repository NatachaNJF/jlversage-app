import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { showAlert, showConfirm } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';

const STATUT_LABELS: Record<string, string> = {
  demande: 'Demande reçue', analyse: 'En analyse', offre_envoyee: 'Offre envoyée',
  documents_demandes: 'Documents demandés', validation_admin: 'Validation administrative',
  autorise: 'Autorisé', en_cours: 'En cours', volume_atteint: 'Volume atteint',
  cloture: 'Clôturé', refuse: 'Refusé',
};
const STATUT_COLORS: Record<string, string> = {
  demande: '#6B7280', analyse: '#F59E0B', offre_envoyee: '#3B82F6',
  documents_demandes: '#8B5CF6', validation_admin: '#F97316',
  autorise: '#10B981', en_cours: '#059669', volume_atteint: '#EF4444',
  cloture: '#6B7280', refuse: '#DC2626',
};
const WORKFLOW = [
  { key: 'demande', label: 'Demande' }, { key: 'analyse', label: 'Analyse' },
  { key: 'offre_envoyee', label: 'Offre' }, { key: 'documents_demandes', label: 'Documents' },
  { key: 'validation_admin', label: 'Validation' }, { key: 'autorise', label: 'Autorisé' },
  { key: 'en_cours', label: 'En cours' }, { key: 'cloture', label: 'Clôturé' },
];

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ActionBtn({ label, color, onPress, loading }: { label: string; color: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={loading}
      style={({ pressed }) => [styles.actionBtn, { backgroundColor: color + '20', borderColor: color + '60', opacity: pressed || loading ? 0.7 : 1 }]}>
      {loading ? <ActivityIndicator size="small" color={color} /> : <Text style={[styles.actionBtnText, { color }]}>{label}</Text>}
    </Pressable>
  );
}

export default function ChantierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isGestionnaire } = useAuthContext();
  const colors = useColors();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const passagesQuery = trpc.passages.listByChantier.useQuery({ chantierId: Number(id) });

  const updateMutation = trpc.chantiers.update.useMutation({
    onSuccess: () => { utils.chantiers.get.invalidate({ id: Number(id) }); utils.chantiers.list.invalidate(); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const envoyerOffreMutation = trpc.chantiers.envoyerOffre.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      showAlert('Succès', "L'offre de prix a été envoyée par email au client.");
      setShowOffreModal(false); setPrixTonne(''); setConditions('');
    },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const autoriserMutation = trpc.chantiers.autoriser.useMutation({
    onSuccess: () => { utils.chantiers.get.invalidate({ id: Number(id) }); utils.chantiers.list.invalidate(); setShowAutoriserModal(false); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const refuserMutation = trpc.chantiers.refuserAdmin.useMutation({
    onSuccess: () => { utils.chantiers.get.invalidate({ id: Number(id) }); utils.chantiers.list.invalidate(); setShowRefusModal(false); setMotifRefus(''); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const cloturerMutation = trpc.chantiers.cloturer.useMutation({
    onSuccess: () => { utils.chantiers.get.invalidate({ id: Number(id) }); utils.chantiers.list.invalidate(); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const confirmerAccordMutation = trpc.chantiers.confirmerAccordClient.useMutation({
    onSuccess: () => { utils.chantiers.get.invalidate({ id: Number(id) }); utils.chantiers.list.invalidate(); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const deleteMutation = trpc.chantiers.delete.useMutation({
    onSuccess: () => { utils.chantiers.list.invalidate(); router.replace('/(tabs)'); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });

  const [showOffreModal, setShowOffreModal] = useState(false);
  const [prixTonne, setPrixTonne] = useState('');
  const [conditions, setConditions] = useState('');
  const [showRefusModal, setShowRefusModal] = useState(false);
  const [motifRefus, setMotifRefus] = useState('');
  const [showAutoriserModal, setShowAutoriserModal] = useState(false);

  if (chantierQuery.isLoading) {
    return <ScreenContainer><View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View></ScreenContainer>;
  }
  const c = chantierQuery.data;
  if (!c) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={{ color: '#6B7280' }}>Dossier introuvable</Text>
          <Pressable onPress={() => router.back()} style={[styles.btn, { backgroundColor: '#2563EB' }]}>
            <Text style={styles.btnText}>Retour</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const statutColor = STATUT_COLORS[c.statut] || '#6B7280';
  const volumeRef = Number(c.volumeDeclare) || Number(c.volumeEstime);
  const tonnage = Number(c.tonnageAccepte) || 0;
  const pct = volumeRef > 0 ? Math.min(100, (tonnage / volumeRef) * 100) : 0;
  const passages = passagesQuery.data ?? [];
  const currentStep = WORKFLOW.findIndex(s => s.key === c.statut);

  function handleSendOffre() {
    if (!prixTonne.trim() || isNaN(Number(prixTonne)) || Number(prixTonne) <= 0) {
      showAlert('Erreur', 'Veuillez saisir un prix à la tonne valide.'); return;
    }
    if (!conditions.trim()) {
      showAlert('Erreur', 'Veuillez saisir les conditions d\'acceptation.'); return;
    }
    envoyerOffreMutation.mutate({ id: Number(id), prixTonne: Number(prixTonne), conditionsAcceptation: conditions.trim() });
  }
  function handleRefuser() {
    if (!motifRefus.trim() || motifRefus.trim().length < 10) {
      showAlert('Motif requis', 'Veuillez indiquer le motif du refus (minimum 10 caractères).'); return;
    }
    refuserMutation.mutate({ id: Number(id), motif: motifRefus.trim() });
  }
  function handleAutoriser() {
    showConfirm('Autoriser le chantier', 'Autoriser définitivement ce chantier ? Un email sera envoyé au client.', () => autoriserMutation.mutate({ id: Number(id) }), 'Autoriser');
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Retour</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{c.societeNom}</Text>
        {['demande', 'analyse'].includes(c.statut) && isGestionnaire ? (
          <Pressable onPress={() => router.push((`/chantier/modifier/${id}`) as any)} style={[styles.btn, { backgroundColor: colors.primary + '20' }]}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Modifier</Text>
          </Pressable>
        ) : <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Statut */}
        <View style={[styles.statutCard, { backgroundColor: statutColor + '15', borderColor: statutColor + '40' }]}>
          <Text style={[styles.statutLabel, { color: statutColor }]}>{STATUT_LABELS[c.statut] || c.statut}</Text>
          {c.statut === 'refuse' && c.motifRefusAdmin ? (
            <Text style={[styles.statutMotif, { color: colors.muted }]}>Motif : {c.motifRefusAdmin}</Text>
          ) : null}
        </View>

        {/* Workflow */}
        {c.statut !== 'refuse' ? (
          <View style={styles.workflowRow}>
            {WORKFLOW.map((step, idx) => {
              const done = idx < currentStep; const active = idx === currentStep;
              return (
                <View key={step.key} style={styles.workflowStep}>
                  <View style={[styles.workflowDot, {
                    backgroundColor: done ? '#10B981' : active ? colors.primary : colors.border,
                    borderColor: done ? '#10B981' : active ? colors.primary : colors.border,
                  }]}>
                    {done ? <Text style={{ color: '#fff', fontSize: 8 }}>✓</Text> : null}
                  </View>
                  <Text style={[styles.workflowLabel, { color: active ? colors.primary : colors.muted }]} numberOfLines={1}>{step.label}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Tonnage */}
        {['en_cours', 'autorise', 'volume_atteint'].includes(c.statut) ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Suivi tonnage</Text>
            <View style={styles.progressRow}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: (pct + '%') as any, backgroundColor: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981' }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>{pct.toFixed(0)}%</Text>
            </View>
            <View style={styles.tonnageRow}>
              <Text style={[styles.tonnageVal, { color: colors.foreground }]}>{tonnage.toFixed(1)} T accepté</Text>
              <Text style={[styles.tonnageRef, { color: colors.muted }]}>/ {volumeRef.toFixed(0)} T autorisé</Text>
            </View>
            {c.statut === 'volume_atteint' ? (
              <View style={styles.alertBox}><Text style={styles.alertText}>🚫 Volume atteint — aucun nouveau camion accepté</Text></View>
            ) : null}
          </View>
        ) : null}

        {/* Société */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Société cliente</Text>
          <InfoRow label="Société" value={c.societeNom} colors={colors} />
          <InfoRow label="Adresse" value={c.societeAdresse || '-'} colors={colors} />
          <InfoRow label="TVA" value={c.societeTva || '-'} colors={colors} />
          <InfoRow label="Email" value={c.societeMail || '-'} colors={colors} />
          <InfoRow label="Contact" value={c.societeContact || '-'} colors={colors} />
          <InfoRow label="Téléphone" value={c.societeTelephone || '-'} colors={colors} />
        </View>

        {/* Chantier */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Chantier</Text>
          <InfoRow label="Localisation" value={c.localisationChantier || '-'} colors={colors} />
          <InfoRow label="Contact site" value={c.contactChantier || '-'} colors={colors} />
          <InfoRow label="Tél. site" value={c.telephoneChantier || '-'} colors={colors} />
          <InfoRow label="Classe" value={`Classe ${c.classe}`} colors={colors} />
          <InfoRow label="Volume estimé" value={`${Number(c.volumeEstime).toFixed(0)} T`} colors={colors} />
          {c.volumeDeclare ? <InfoRow label="Volume déclaré" value={`${Number(c.volumeDeclare).toFixed(0)} T`} colors={colors} /> : null}
          {c.referenceWalterre ? <InfoRow label="Réf. Walterre" value={c.referenceWalterre} colors={colors} /> : null}
          <InfoRow label="Période" value={`${c.periodeDebut} → ${c.periodeFin}`} colors={colors} />
          {c.prixTonne ? <InfoRow label="Prix à la tonne" value={`${Number(c.prixTonne).toFixed(2)} €/T`} colors={colors} /> : null}
        </View>

        {/* Actions gestionnaire */}
        {isGestionnaire && c.statut !== 'refuse' && c.statut !== 'cloture' ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Actions</Text>

            {c.statut === 'demande' ? (
              <ActionBtn label="Passer en analyse" color="#F59E0B" loading={updateMutation.isPending}
                onPress={() => showConfirm('Passer en analyse', 'Passer ce dossier en analyse ?', () => updateMutation.mutate({ id: Number(id), data: { statut: 'analyse' } as any }))} />
            ) : null}

            {c.statut === 'analyse' ? (
              <ActionBtn label="Envoyer l'offre de prix" color="#3B82F6" onPress={() => setShowOffreModal(true)} loading={envoyerOffreMutation.isPending} />
            ) : null}

            {c.statut === 'offre_envoyee' ? (
              <ActionBtn label="Confirmer accord client → Documents" color="#8B5CF6" loading={confirmerAccordMutation.isPending}
                onPress={() => showConfirm('Accord client', 'Le client a accepté l\'offre ? Passer à la demande de documents Walterre ?', () => confirmerAccordMutation.mutate({ id: Number(id) }))} />
            ) : null}

            {c.statut === 'documents_demandes' ? (
              <ActionBtn label="Saisir les documents Walterre" color="#F97316"
                onPress={() => router.push((`/chantier/documents/${id}`) as any)} />
            ) : null}

            {c.statut === 'validation_admin' ? (
              <>
                <ActionBtn label="✅ Autoriser le chantier" color="#10B981" onPress={handleAutoriser} loading={autoriserMutation.isPending} />
                <ActionBtn label="❌ Refuser le dossier" color="#EF4444" onPress={() => setShowRefusModal(true)} loading={refuserMutation.isPending} />
              </>
            ) : null}

            {['autorise', 'en_cours', 'volume_atteint'].includes(c.statut) ? (
              <ActionBtn label="Clôturer le chantier" color="#6B7280" loading={cloturerMutation.isPending}
                onPress={() => showConfirm('Clôturer le chantier', 'Confirmer la clôture définitive ?', () => cloturerMutation.mutate({ id: Number(id) }), 'Clôturer', true)} />
            ) : null}

            {['demande', 'analyse', 'refuse'].includes(c.statut) ? (
              <ActionBtn label="Supprimer ce chantier" color="#DC2626" loading={deleteMutation.isPending}
                onPress={() => showConfirm('Supprimer le chantier', `Supprimer définitivement le chantier de ${c.societeNom} ? Cette action est irréversible.`, () => deleteMutation.mutate({ id: Number(id) }), 'Supprimer', true)} />
            ) : null}
          </View>
        ) : null}

        {/* Passages */}
        {passages.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Derniers passages ({passages.length})</Text>
            {passages.slice(0, 5).map((p: any) => (
              <View key={p.id} style={[styles.passageRow, { borderTopColor: colors.border }]}>
                <View>
                  <Text style={[styles.passagePlaque, { color: colors.foreground }]}>{p.plaque}</Text>
                  <Text style={[styles.passageDate, { color: colors.muted }]}>{p.datePassage} {p.heureArrivee}</Text>
                </View>
                <Text style={[styles.passageTonnage, { color: p.accepte ? '#10B981' : '#EF4444' }]}>
                  {p.accepte ? `+${Number(p.tonnage).toFixed(1)} T` : '✗ Refusé'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal offre */}
      {showOffreModal ? (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Offre de prix</Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>Prix à la tonne (€) *</Text>
            <TextInput value={prixTonne} onChangeText={setPrixTonne} placeholder="Ex: 12.50" keyboardType="numeric"
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.modalDesc, { color: colors.muted, marginTop: 8 }]}>Conditions d'acceptation *</Text>
            <TextInput value={conditions} onChangeText={setConditions} placeholder="Ex: Terres classe 1-2, bon Walterre obligatoire..." multiline
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, minHeight: 60, textAlignVertical: 'top' }]} />
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowOffreModal(false)} style={[styles.modalBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Annuler</Text>
              </Pressable>
              <Pressable onPress={handleSendOffre} disabled={envoyerOffreMutation.isPending}
                style={[styles.modalBtn, { backgroundColor: '#3B82F6', opacity: envoyerOffreMutation.isPending ? 0.7 : 1 }]}>
                {envoyerOffreMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Envoyer</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/* Modal refus */}
      {showRefusModal ? (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Refuser le dossier</Text>
            <Text style={[styles.modalDesc, { color: colors.muted }]}>Motif du refus (min. 10 caractères). Un email sera envoyé au client.</Text>
            <TextInput value={motifRefus} onChangeText={setMotifRefus} placeholder="Ex: Documents non conformes, délai dépassé..." multiline
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, minHeight: 80, textAlignVertical: 'top' }]} />
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowRefusModal(false)} style={[styles.modalBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Annuler</Text>
              </Pressable>
              <Pressable onPress={handleRefuser} disabled={refuserMutation.isPending}
                style={[styles.modalBtn, { backgroundColor: '#EF4444', opacity: refuserMutation.isPending ? 0.7 : 1 }]}>
                {refuserMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Refuser</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backText: { fontSize: 17 },
  headerTitle: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600' },
  statutCard: { borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  statutLabel: { fontSize: 17, fontWeight: '700' },
  statutMotif: { fontSize: 13 },
  workflowRow: { flexDirection: 'row', gap: 4 },
  workflowStep: { flex: 1, alignItems: 'center', gap: 4 },
  workflowDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  workflowLabel: { fontSize: 8, textAlign: 'center' },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '600', minWidth: 36, textAlign: 'right' },
  tonnageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  tonnageVal: { fontSize: 20, fontWeight: '700' },
  tonnageRef: { fontSize: 14 },
  alertBox: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10 },
  alertText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '500', flex: 2, textAlign: 'right' },
  actionBtn: { borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center', marginBottom: 4 },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
  passageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 0.5 },
  passagePlaque: { fontSize: 14, fontWeight: '600' },
  passageDate: { fontSize: 12 },
  passageTonnage: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { borderRadius: 20, padding: 24, width: '100%', gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalDesc: { fontSize: 14, lineHeight: 20 },
  modalInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});
