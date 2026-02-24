import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { Chantier, ChantierStatut, STATUT_LABELS, STATUT_COLORS } from "@/types";

const FILTRES: { label: string; valeur: ChantierStatut | 'tous' }[] = [
  { label: 'Tous', valeur: 'tous' },
  { label: 'Autorisés', valeur: 'autorise' },
  { label: 'En cours', valeur: 'en_cours' },
  { label: 'En attente', valeur: 'validation_admin' },
  { label: 'Clôturés', valeur: 'cloture' },
];

function ChantierItem({ chantier, onPress }: { chantier: Chantier; onPress: () => void }) {
  const colors = useColors();
  const statutColor = STATUT_COLORS[chantier.statut] || colors.muted;
  const pct = chantier.volumeDeclare
    ? Math.min(100, Math.round((chantier.tonnageAccepte / chantier.volumeDeclare) * 100))
    : 0;

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <Text style={[styles.itemNom, { color: colors.foreground }]} numberOfLines={1}>
            {chantier.societe.nom}
          </Text>
          <Text style={[styles.itemLoc, { color: colors.muted }]} numberOfLines={1}>
            {chantier.localisationChantier}
          </Text>
        </View>
        <View style={[styles.statutBadge, { backgroundColor: statutColor + '20' }]}>
          <Text style={[styles.statutText, { color: statutColor }]}>
            {STATUT_LABELS[chantier.statut]}
          </Text>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.itemMeta}>
          <IconSymbol name="scalemass.fill" size={12} color={colors.muted} />
          <Text style={[styles.itemMetaText, { color: colors.muted }]}>
            {chantier.tonnageAccepte.toFixed(1)} / {(chantier.volumeDeclare || chantier.volumeEstime).toFixed(0)} T
          </Text>
        </View>
        <View style={styles.itemMeta}>
          <IconSymbol name="calendar" size={12} color={colors.muted} />
          <Text style={[styles.itemMetaText, { color: colors.muted }]}>
            Cl. {chantier.classe}
          </Text>
        </View>
        {chantier.tonnageAccepte > 0 && (
          <View style={styles.progressMini}>
            <View style={[styles.progressBarMini, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFillMini, {
                width: `${pct}%` as any,
                backgroundColor: pct >= 90 ? colors.error : colors.primary
              }]} />
            </View>
            <Text style={[styles.pctText, { color: pct >= 90 ? colors.error : colors.primary }]}>{pct}%</Text>
          </View>
        )}
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function ChantiersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { chantiers } = useApp();
  const [filtre, setFiltre] = useState<ChantierStatut | 'tous'>('tous');
  const [recherche, setRecherche] = useState('');

  const chantiersFiltres = useMemo(() => {
    return chantiers.filter(c => {
      const matchFiltre = filtre === 'tous' || c.statut === filtre;
      const matchRecherche = !recherche ||
        c.societe.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        c.localisationChantier.toLowerCase().includes(recherche.toLowerCase()) ||
        (c.referenceWalterre || '').toLowerCase().includes(recherche.toLowerCase());
      return matchFiltre && matchRecherche;
    });
  }, [chantiers, filtre, recherche]);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.titre, { color: colors.foreground }]}>Chantiers</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/chantier/nouveau' as any)}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Rechercher un chantier..."
          placeholderTextColor={colors.muted}
          value={recherche}
          onChangeText={setRecherche}
          returnKeyType="search"
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')}>
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <FlatList
        data={FILTRES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtresContainer}
        keyExtractor={item => item.valeur}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filtreBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
              filtre === item.valeur && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setFiltre(item.valeur)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.filtreText,
              { color: colors.muted },
              filtre === item.valeur && { color: '#fff' },
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Liste */}
      <FlatList
        data={chantiersFiltres}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ChantierItem
            chantier={item}
            onPress={() => router.push(`/chantier/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="folder.fill" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {recherche ? 'Aucun résultat' : 'Aucun chantier'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/chantier/nouveau' as any)}
            >
              <Text style={styles.emptyBtnText}>Nouveau chantier</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  titre: { fontSize: 22, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filtresContainer: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filtreBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filtreText: { fontSize: 13, fontWeight: '500' },
  liste: { padding: 16, paddingTop: 4, gap: 10 },
  item: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  itemLeft: { flex: 1, gap: 3 },
  itemNom: { fontSize: 14, fontWeight: '600' },
  itemLoc: { fontSize: 12 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statutText: { fontSize: 11, fontWeight: '600' },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemMetaText: { fontSize: 12 },
  progressMini: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressBarMini: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFillMini: { height: '100%', borderRadius: 2 },
  pctText: { fontSize: 11, fontWeight: '600', minWidth: 28 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
