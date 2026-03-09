import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { showAlert } from '@/lib/alert';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';

function formatDate(d: string) {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FacturationScreen() {
  const colors = useColors();
  const chantiersQuery = trpc.chantiers.list.useQuery();
  const chantiers = chantiersQuery.data ?? [];

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';

  const [chantierId, setChantierId] = useState<number | null>(null);
  const [dateDebut, setDateDebut] = useState(firstOfMonth);
  const [dateFin, setDateFin] = useState(today);
  const [showResult, setShowResult] = useState(false);

  const factQuery = trpc.stats.facturation.useQuery(
    { chantierId: chantierId!, dateDebut, dateFin },
    { enabled: showResult && chantierId !== null }
  );

  function handleGenerer() {
    if (!chantierId) { showAlert('Erreur', 'Veuillez sélectionner un chantier.'); return; }
    setShowResult(true);
  }

  function handleExportCSV() {
    if (!factQuery.data) return;
    const { chantier, passages, totalTonnage, prixTonne, montantTotal } = factQuery.data;
    const lines = [
      'Date;Heure;Plaque;Transporteur;Tonnage (T)',
      ...passages.map((p: any) => `${p.datePassage};${p.heureArrivee || ''};${p.plaque};${p.transporteur};${Number(p.tonnage).toFixed(2)}`),
      '',
      `Total;;; ;${totalTonnage.toFixed(2)}`,
      `Prix/tonne;;; ;${prixTonne.toFixed(2)} EUR`,
      `Montant total;;; ;${montantTotal.toFixed(2)} EUR`,
    ];
    showAlert('Export CSV', 'Données du récapitulatif :\n\n' + lines.slice(0, 5).join('\n') + '\n...\n\n(Dans la version publiée, ce fichier sera téléchargeable)');
  }

  const chantierSelectionne = chantiers.find((c: any) => c.id === chantierId);

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Facturation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Sélection chantier */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Chantier</Text>
          {chantiersQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                {chantiers.map((c: any) => {
                  const sel = chantierId === c.id;
                  return (
                    <Pressable key={c.id} onPress={() => { setChantierId(c.id); setShowResult(false); }}
                      style={[styles.chantierChip, { backgroundColor: sel ? colors.primary : colors.background, borderColor: sel ? colors.primary : colors.border }]}>
                      <Text style={[styles.chantierChipText, { color: sel ? '#fff' : colors.foreground }]} numberOfLines={1}>{c.societeNom}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Période */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Période</Text>
          <View style={styles.periodRow}>
            <View style={styles.periodField}>
              <Text style={[styles.periodLabel, { color: colors.muted }]}>Du</Text>
              <Pressable
                onPress={() => {
                  // Mois précédent
                  const d = new Date(dateDebut);
                  d.setMonth(d.getMonth() - 1);
                  setDateDebut(d.toISOString().split('T')[0].slice(0, 8) + '01');
                  setShowResult(false);
                }}
                style={[styles.periodBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.periodBtnText, { color: colors.foreground }]}>{formatDate(dateDebut)}</Text>
              </Pressable>
            </View>
            <Text style={[styles.periodSep, { color: colors.muted }]}>→</Text>
            <View style={styles.periodField}>
              <Text style={[styles.periodLabel, { color: colors.muted }]}>Au</Text>
              <Pressable
                onPress={() => {
                  setDateFin(today);
                  setShowResult(false);
                }}
                style={[styles.periodBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.periodBtnText, { color: colors.foreground }]}>{formatDate(dateFin)}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.periodShortcuts}>
            {[
              { label: 'Ce mois', debut: firstOfMonth, fin: today },
              { label: 'Mois dernier', debut: (() => { const d = new Date(today); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0].slice(0, 8) + '01'; })(), fin: (() => { const d = new Date(today); d.setDate(0); return d.toISOString().split('T')[0]; })() },
              { label: 'Cette année', debut: today.slice(0, 4) + '-01-01', fin: today },
            ].map(s => (
              <Pressable key={s.label} onPress={() => { setDateDebut(s.debut); setDateFin(s.fin); setShowResult(false); }}
                style={[styles.shortcutBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.shortcutBtnText, { color: colors.primary }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bouton générer */}
        <Pressable onPress={handleGenerer}
          style={({ pressed }) => [styles.generateBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={styles.generateBtnText}>Générer le récapitulatif</Text>
        </Pressable>

        {/* Résultats */}
        {showResult && factQuery.isLoading && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Calcul en cours...</Text>
          </View>
        )}

        {showResult && factQuery.data && (() => {
          const { chantier, passages, totalTonnage, prixTonne, montantTotal } = factQuery.data;
          return (
            <>
              {/* En-tête récapitulatif */}
              <View style={[styles.recapHeader, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.recapTitre, { color: colors.primary }]}>Récapitulatif — {chantier.societeNom}</Text>
                <Text style={[styles.recapPeriode, { color: colors.muted }]}>{formatDate(dateDebut)} → {formatDate(dateFin)}</Text>
              </View>

              {/* Totaux */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.totalRow}>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalVal, { color: colors.foreground }]}>{passages.length}</Text>
                    <Text style={[styles.totalLbl, { color: colors.muted }]}>Passages</Text>
                  </View>
                  <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalVal, { color: colors.primary }]}>{totalTonnage.toFixed(2)} T</Text>
                    <Text style={[styles.totalLbl, { color: colors.muted }]}>Tonnage total</Text>
                  </View>
                  <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalVal, { color: '#10B981' }]}>{prixTonne.toFixed(2)} €</Text>
                    <Text style={[styles.totalLbl, { color: colors.muted }]}>Prix/tonne</Text>
                  </View>
                </View>
                <View style={[styles.montantBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
                  <Text style={[styles.montantLabel, { color: colors.muted }]}>Montant total HTVA</Text>
                  <Text style={[styles.montantVal, { color: colors.primary }]}>{montantTotal.toFixed(2)} €</Text>
                </View>
              </View>

              {/* Bouton export */}
              <Pressable onPress={handleExportCSV}
                style={({ pressed }) => [styles.exportBtn, { backgroundColor: '#10B981', opacity: pressed ? 0.8 : 1 }]}>
                <Text style={styles.exportBtnText}>📊 Exporter CSV</Text>
              </Pressable>

              {/* Liste des passages */}
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Détail des passages ({passages.length})</Text>
                {passages.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun passage accepté sur cette période</Text>
                ) : (
                  passages.map((p: any, idx: number) => (
                    <View key={p.id || idx} style={[styles.passageLine, { borderBottomColor: colors.border }]}>
                      <View style={styles.passageLineLeft}>
                        <Text style={[styles.passagePlaque, { color: colors.foreground }]}>{p.plaque}</Text>
                        <Text style={[styles.passageMeta, { color: colors.muted }]}>{formatDate(p.datePassage)} · {p.heureArrivee || '-'} · {p.transporteur}</Text>
                      </View>
                      <Text style={[styles.passageTonnage, { color: colors.primary }]}>{Number(p.tonnage).toFixed(2)} T</Text>
                    </View>
                  ))
                )}
              </View>
            </>
          );
        })()}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  chantierChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, maxWidth: 160 },
  chantierChipText: { fontSize: 13, fontWeight: '600' },
  periodRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  periodField: { flex: 1, gap: 4 },
  periodLabel: { fontSize: 12 },
  periodBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  periodBtnText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  periodSep: { fontSize: 18, marginBottom: 8 },
  periodShortcuts: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  shortcutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  shortcutBtnText: { fontSize: 12, fontWeight: '600' },
  generateBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingCenter: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 14 },
  recapHeader: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 4 },
  recapTitre: { fontSize: 16, fontWeight: '700' },
  recapPeriode: { fontSize: 13 },
  totalRow: { flexDirection: 'row' },
  totalItem: { flex: 1, alignItems: 'center', gap: 2 },
  totalVal: { fontSize: 18, fontWeight: '800' },
  totalLbl: { fontSize: 11 },
  totalDivider: { width: 0.5, marginVertical: 4 },
  montantBox: { borderRadius: 10, padding: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  montantLabel: { fontSize: 14 },
  montantVal: { fontSize: 22, fontWeight: '800' },
  exportBtn: { borderRadius: 14, padding: 14, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  passageLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5 },
  passageLineLeft: { flex: 1, gap: 2 },
  passagePlaque: { fontSize: 14, fontWeight: '600' },
  passageMeta: { fontSize: 12 },
  passageTonnage: { fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
});
