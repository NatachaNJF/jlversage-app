import { useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';

const STATUTS = [
  { key: 'tous', label: 'Tous' },
  { key: 'demande', label: 'Demande' },
  { key: 'offre_envoyee', label: 'Offre' },
  { key: 'validation_admin', label: 'Validation' },
  { key: 'autorise', label: 'Autorisé' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'volume_atteint', label: 'Vol. atteint' },
  { key: 'refuse', label: 'Refusé' },
  { key: 'cloture', label: 'Clôturé' },
];

const STATUT_COLORS: Record<string, string> = {
  demande: '#6B7280', analyse: '#F59E0B', offre_envoyee: '#3B82F6',
  documents_demandes: '#8B5CF6', validation_admin: '#F97316',
  autorise: '#10B981', en_cours: '#059669', volume_atteint: '#EF4444',
  cloture: '#6B7280', refuse: '#DC2626',
};

const STATUT_LABELS: Record<string, string> = {
  demande: 'Demande', analyse: 'Analyse', offre_envoyee: 'Offre envoyée',
  documents_demandes: 'Documents', validation_admin: 'Validation admin',
  autorise: 'Autorisé', en_cours: 'En cours', volume_atteint: 'Volume atteint',
  cloture: 'Clôturé', refuse: 'Refusé',
};

export default function ChantiersScreen() {
  const { isAuthenticated, isGestionnaire } = useAuthContext();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');

  const chantiersQuery = trpc.chantiers.list.useQuery(undefined, { enabled: isAuthenticated });
  const chantiers = chantiersQuery.data ?? [];

  const filtered = chantiers.filter(c => {
    const matchSearch = !search ||
      c.societeNom.toLowerCase().includes(search.toLowerCase()) ||
      (c.localisationChantier || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.referenceWalterre || '').toLowerCase().includes(search.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Dossiers chantiers</Text>
        {isGestionnaire && (
          <Pressable
            onPress={() => router.push('/chantier/nouveau' as any)}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.addBtnText}>+ Nouveau</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher société, localisation, référence..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      <FlatList
        data={STATUTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtresContainer}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFiltreStatut(item.key)}
            style={[
              styles.filtreChip,
              {
                backgroundColor: filtreStatut === item.key ? colors.primary : colors.surface,
                borderColor: filtreStatut === item.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.filtreText, { color: filtreStatut === item.key ? '#fff' : colors.muted }]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {chantiersQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {search || filtreStatut !== 'tous' ? 'Aucun résultat' : 'Aucun dossier'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const volumeRef = Number(item.volumeDeclare) || Number(item.volumeEstime);
            const tonnage = Number(item.tonnageAccepte) || 0;
            const pct = volumeRef > 0 ? Math.min(100, (tonnage / volumeRef) * 100) : 0;
            const couleur = STATUT_COLORS[item.statut] || '#6B7280';
            return (
              <Pressable
                onPress={() => router.push(('/chantier/' + item.id) as any)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardNom, { color: colors.foreground }]} numberOfLines={1}>
                      {item.societeNom}
                    </Text>
                    <Text style={[styles.cardLoc, { color: colors.muted }]} numberOfLines={1}>
                      {item.localisationChantier}
                    </Text>
                  </View>
                  <View style={[styles.statutBadge, { backgroundColor: couleur + '20' }]}>
                    <Text style={[styles.statutText, { color: couleur }]}>
                      {STATUT_LABELS[item.statut] || item.statut}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={[styles.metaText, { color: colors.muted }]}>
                    Classe {item.classe} · {Number(item.volumeEstime).toFixed(0)} T estimé
                  </Text>
                  {item.referenceWalterre && (
                    <Text style={[styles.metaText, { color: colors.muted }]}>
                      Réf. {item.referenceWalterre}
                    </Text>
                  )}
                </View>
                {['en_cours', 'autorise', 'volume_atteint'].includes(item.statut) && (
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, {
                        width: (pct + '%') as any,
                        backgroundColor: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981',
                      }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.muted }]}>
                      {tonnage.toFixed(0)}T / {volumeRef.toFixed(0)}T
                    </Text>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <Text style={[styles.footerText, { color: colors.muted }]}>
                    {item.periodeDebut} → {item.periodeFin}
                  </Text>
                  {item.prixTonne && (
                    <Text style={[styles.footerText, { color: colors.primary, fontWeight: '600' }]}>
                      {Number(item.prixTonne).toFixed(2)} €/T
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filtresContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filtreChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filtreText: { fontSize: 13, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardNom: { fontSize: 15, fontWeight: '600' },
  cardLoc: { fontSize: 13, marginTop: 2 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statutText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, minWidth: 80, textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12 },
});
