import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { showAlert } from '@/lib/alert';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';

const STATUT_LABELS: Record<string, string> = {
  ouvert: '🔴 Ouvert',
  en_cours: '🟡 En cours',
  resolu: '🟢 Résolu',
};

const STATUT_COLORS: Record<string, string> = {
  ouvert: '#EF4444',
  en_cours: '#F59E0B',
  resolu: '#10B981',
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const utils = trpc.useUtils();

  const incidentQuery = trpc.incidents.get.useQuery({ id: Number(id) });
  const incident = incidentQuery.data;

  const updateMutation = trpc.incidents.updateStatut.useMutation({
    onSuccess: () => {
      utils.incidents.get.invalidate({ id: Number(id) });
      utils.incidents.list.invalidate();
      setNotes('');
      setShowNotes(false);
      setTargetStatut(null);
    },
    onError: (err: any) => showAlert('Erreur', err.message),
  });

  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [targetStatut, setTargetStatut] = useState<'en_cours' | 'resolu' | null>(null);

  function handleChangeStatut(statut: 'en_cours' | 'resolu') {
    setTargetStatut(statut);
    setShowNotes(true);
  }

  function handleConfirmStatut() {
    if (!targetStatut) return;
    updateMutation.mutate({ id: Number(id), statut: targetStatut, notes: notes.trim() || undefined });
  }

  if (incidentQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!incident) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>Incident introuvable</Text>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.backBtnText}>Retour</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const historique: any[] = incident.historiqueActions ? JSON.parse(incident.historiqueActions as string) : [];
  const statutColor = STATUT_COLORS[incident.statut as string] || colors.muted;

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Retour</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Incident #{id}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Statut */}
        <View style={[styles.statutBanner, { backgroundColor: statutColor + '15', borderColor: statutColor }]}>
          <Text style={[styles.statutText, { color: statutColor }]}>{STATUT_LABELS[incident.statut as string] || String(incident.statut)}</Text>
          {incident.dateResolution && (
            <Text style={[styles.statutDate, { color: colors.muted }]}>Résolu le {String(incident.dateResolution)}</Text>
          )}
        </View>

        {/* Infos principales */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Informations</Text>
          <InfoRow label="Type" value={incident.type === 'camion_refuse' ? '🚛 Camion refusé' : incident.type === 'suspicion_post_deversement' ? '⚠️ Suspicion post-déversement' : '📋 Autre'} colors={colors} />
          <InfoRow label="Chantier" value={String(incident.chantierNom)} colors={colors} />
          <InfoRow label="Date" value={String(incident.date)} colors={colors} />
          {incident.zoneIsolee ? <InfoRow label="Zone isolée" value="Oui" colors={colors} /> : null}
          {incident.clientInforme ? <InfoRow label="Client informé" value="Oui" colors={colors} /> : null}
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Description</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{String(incident.description)}</Text>
          {incident.notes ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.notesLabel, { color: colors.muted }]}>Notes complémentaires</Text>
              <Text style={[styles.description, { color: colors.foreground }]}>{String(incident.notes)}</Text>
            </>
          ) : null}
        </View>

        {/* Résolution */}
        {incident.statut === 'resolu' && incident.notesResolution ? (
          <View style={[styles.card, { backgroundColor: '#10B98110', borderColor: '#10B981' }]}>
            <Text style={[styles.cardTitle, { color: '#10B981' }]}>Résolution</Text>
            <Text style={[styles.description, { color: colors.foreground }]}>{String(incident.notesResolution)}</Text>
            {incident.resoluParNom ? (
              <Text style={[styles.resolvedBy, { color: colors.muted }]}>Par {String(incident.resoluParNom)}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Actions */}
        {incident.statut !== 'resolu' && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Actions</Text>
            {incident.statut === 'ouvert' && (
              <Pressable onPress={() => handleChangeStatut('en_cours')}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B', opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>🟡 Marquer "En cours"</Text>
              </Pressable>
            )}
            <Pressable onPress={() => handleChangeStatut('resolu')}
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#10B98120', borderColor: '#10B981', opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.actionBtnText, { color: '#10B981' }]}>✅ Marquer comme résolu</Text>
            </Pressable>
          </View>
        )}

        {/* Saisie notes pour changement de statut */}
        {showNotes && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {targetStatut === 'resolu' ? 'Notes de résolution (optionnel)' : 'Notes (optionnel)'}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Décrivez les actions prises..."
              multiline
              placeholderTextColor={colors.muted}
              style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            <View style={styles.notesActions}>
              <Pressable onPress={() => { setShowNotes(false); setTargetStatut(null); }}
                style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Annuler</Text>
              </Pressable>
              <Pressable onPress={handleConfirmStatut} disabled={updateMutation.isPending}
                style={({ pressed }) => [styles.confirmBtn, { backgroundColor: colors.primary, opacity: pressed || updateMutation.isPending ? 0.7 : 1 }]}>
                {updateMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.confirmBtnText}>Confirmer</Text>
                }
              </Pressable>
            </View>
          </View>
        )}

        {/* Historique */}
        {historique.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Historique ({historique.length})</Text>
            {historique.map((h: any, idx: number) => (
              <View key={idx} style={[styles.histoItem, { borderLeftColor: colors.primary }]}>
                <Text style={[styles.histoAction, { color: colors.foreground }]}>{h.action}</Text>
                <Text style={[styles.histoMeta, { color: colors.muted }]}>
                  {h.par} · {new Date(h.date).toLocaleDateString('fr-BE')} {new Date(h.date).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {h.notes ? <Text style={[styles.histoNotes, { color: colors.muted }]}>{h.notes}</Text> : null}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backText: { fontSize: 17 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  statutBanner: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  statutText: { fontSize: 18, fontWeight: '700' },
  statutDate: { fontSize: 13 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  divider: { height: 0.5 },
  description: { fontSize: 14, lineHeight: 20 },
  notesLabel: { fontSize: 12 },
  resolvedBy: { fontSize: 12 },
  actionBtn: { borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
  notesInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  notesActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  confirmBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  histoItem: { borderLeftWidth: 3, paddingLeft: 10, gap: 2 },
  histoAction: { fontSize: 14, fontWeight: '600' },
  histoMeta: { fontSize: 12 },
  histoNotes: { fontSize: 12, fontStyle: 'italic' },
});
