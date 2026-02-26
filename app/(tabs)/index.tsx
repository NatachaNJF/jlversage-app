import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';

const STATUT_LABELS: Record<string, string> = {
  demande: 'Demande reçue', analyse: 'En analyse', offre_envoyee: 'Offre envoyée',
  documents_demandes: 'Documents demandés', validation_admin: 'Validation admin',
  autorise: 'Autorisé', en_cours: 'En cours', volume_atteint: 'Volume atteint',
  cloture: 'Clôturé', refuse: 'Refusé',
};
const STATUT_COLORS: Record<string, string> = {
  demande: '#6B7280', analyse: '#F59E0B', offre_envoyee: '#3B82F6',
  documents_demandes: '#8B5CF6', validation_admin: '#F97316',
  autorise: '#10B981', en_cours: '#059669', volume_atteint: '#EF4444',
  cloture: '#6B7280', refuse: '#DC2626',
};

export default function DashboardScreen() {
  const { user, isGestionnaire } = useAuthContext();
  const colors = useColors();
  const today = new Date().toISOString().split('T')[0];

  const statsQuery = trpc.stats.jour.useQuery({ date: today });
  const chantiersQuery = trpc.chantiers.list.useQuery();
  const incidentsQuery = trpc.incidents.list.useQuery();

  const isLoading = statsQuery.isLoading || chantiersQuery.isLoading;

  function handleRefresh() {
    statsQuery.refetch();
    chantiersQuery.refetch();
    incidentsQuery.refetch();
  }

  const stats = statsQuery.data;
  const chantiers = chantiersQuery.data ?? [];
  const incidents = (incidentsQuery.data ?? []).filter((i: any) => i.statut !== 'resolu');

  const chantiersActifs = chantiers.filter((c: any) => ['autorise', 'en_cours'].includes(c.statut));
  const chantiersEnAttente = chantiers.filter((c: any) => ['demande', 'analyse', 'offre_envoyee', 'documents_demandes', 'validation_admin'].includes(c.statut));

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isGestionnaire ? '📊 Tableau de bord' : '🚛 Contrôle site'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        {isGestionnaire && (
          <Pressable
            onPress={() => router.push('/chantier/nouveau' as any)}
            style={({ pressed }) => [styles.newBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.newBtnText}>+ Dossier</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      >
        {/* Stats du jour */}
        <View style={[styles.statsGrid]}>
          <StatCard
            label="Camions aujourd'hui"
            value={stats ? String(stats.totalCamions) : '—'}
            color="#3B82F6"
            colors={colors}
          />
          <StatCard
            label="Tonnage accepté"
            value={stats ? `${Number(stats.tonnageAccepte).toFixed(0)} T` : '—'}
            color="#10B981"
            colors={colors}
          />
          <StatCard
            label="Refus"
            value={stats ? String(stats.refuses) : '—'}
            color="#EF4444"
            colors={colors}
          />
          <StatCard
            label="Incidents ouverts"
            value={String(incidents.length)}
            color={incidents.length > 0 ? '#F59E0B' : '#10B981'}
            colors={colors}
          />
        </View>

        {/* Alertes */}
        {incidents.length > 0 && (
          <Pressable
            onPress={() => router.push('/incident/nouveau' as any)}
            style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}
          >
            <Text style={styles.alertBannerText}>⚠️ {incidents.length} incident(s) ouvert(s) — Appuyer pour voir</Text>
          </Pressable>
        )}

        {/* Chantiers actifs */}
        {chantiersActifs.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chantiers actifs ({chantiersActifs.length})</Text>
            {chantiersActifs.map((c: any) => {
              const volumeRef = Number(c.volumeDeclare) || Number(c.volumeEstime);
              const tonnage = Number(c.tonnageAccepte) || 0;
              const pct = volumeRef > 0 ? Math.min(100, (tonnage / volumeRef) * 100) : 0;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => router.push((`/chantier/${c.id}`) as any)}
                  style={({ pressed }) => [styles.chantierCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={styles.chantierCardHeader}>
                    <Text style={[styles.chantierNom, { color: colors.foreground }]} numberOfLines={1}>{c.societeNom}</Text>
                    <View style={[styles.statutBadge, { backgroundColor: (STATUT_COLORS[c.statut] || '#6B7280') + '20' }]}>
                      <Text style={[styles.statutBadgeText, { color: STATUT_COLORS[c.statut] || '#6B7280' }]}>
                        {STATUT_LABELS[c.statut] || c.statut}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.chantierLoc, { color: colors.muted }]} numberOfLines={1}>{c.localisationChantier}</Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { width: (pct + '%') as any, backgroundColor: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.muted }]}>{tonnage.toFixed(0)} / {volumeRef.toFixed(0)} T</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Chantiers en attente (gestionnaire seulement) */}
        {isGestionnaire && chantiersEnAttente.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>En attente d'action ({chantiersEnAttente.length})</Text>
            {chantiersEnAttente.slice(0, 5).map((c: any) => (
              <Pressable
                key={c.id}
                onPress={() => router.push((`/chantier/${c.id}`) as any)}
                style={({ pressed }) => [styles.chantierCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={styles.chantierCardHeader}>
                  <Text style={[styles.chantierNom, { color: colors.foreground }]} numberOfLines={1}>{c.societeNom}</Text>
                  <View style={[styles.statutBadge, { backgroundColor: (STATUT_COLORS[c.statut] || '#6B7280') + '20' }]}>
                    <Text style={[styles.statutBadgeText, { color: STATUT_COLORS[c.statut] || '#6B7280' }]}>
                      {STATUT_LABELS[c.statut] || c.statut}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.chantierLoc, { color: colors.muted }]} numberOfLines={1}>{c.localisationChantier}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Action rapide préposé */}
        {!isGestionnaire && (
          <View style={styles.quickActions}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Actions rapides</Text>
            <Pressable
              onPress={() => router.push('/camion/nouveau' as any)}
              style={({ pressed }) => [styles.quickBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.quickBtnText}>🚛 Enregistrer un camion</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/incident/nouveau' as any)}
              style={({ pressed }) => [styles.quickBtn, { backgroundColor: '#F59E0B', opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.quickBtnText}>⚠️ Signaler un incident</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color + '12', borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  newBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  alertBanner: { borderRadius: 12, padding: 12, borderWidth: 1 },
  alertBannerText: { fontSize: 14, color: '#92400E', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chantierCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8, gap: 6 },
  chantierCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chantierNom: { fontSize: 15, fontWeight: '600', flex: 1 },
  chantierLoc: { fontSize: 13 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statutBadgeText: { fontSize: 11, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, minWidth: 80, textAlign: 'right' },
  quickActions: { gap: 10 },
  quickBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  quickBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
