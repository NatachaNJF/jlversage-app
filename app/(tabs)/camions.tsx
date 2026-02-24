import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { PassageCamion, MOTIF_REFUS_LABELS } from "@/types";

function PassageItem({ passage }: { passage: PassageCamion }) {
  const colors = useColors();
  return (
    <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statutBar, { backgroundColor: passage.accepte ? colors.success : colors.error }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.plaque, { color: colors.foreground }]}>{passage.plaque}</Text>
          <Text style={[styles.heure, { color: colors.muted }]}>{passage.heure}</Text>
        </View>
        <Text style={[styles.chantierNom, { color: colors.muted }]} numberOfLines={1}>
          {passage.chantierNom}
        </Text>
        <View style={styles.itemFooter}>
          <Text style={[styles.transporteur, { color: colors.muted }]}>{passage.transporteur}</Text>
          {passage.accepte ? (
            <Text style={[styles.tonnage, { color: colors.success }]}>{passage.tonnage.toFixed(1)} T acceptées</Text>
          ) : (
            <Text style={[styles.refusMotif, { color: colors.error }]}>
              {passage.motifRefus ? MOTIF_REFUS_LABELS[passage.motifRefus] : 'Refusé'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function CamionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { passages, chantiers } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const passagesAujourdhui = useMemo(
    () => passages.filter(p => p.date.startsWith(today)).sort((a, b) => b.heure.localeCompare(a.heure)),
    [passages, today]
  );

  const chantiersAutorises = useMemo(
    () => chantiers.filter(c => c.statut === 'autorise' || c.statut === 'en_cours'),
    [chantiers]
  );

  const acceptes = passagesAujourdhui.filter(p => p.accepte);
  const refus = passagesAujourdhui.filter(p => !p.accepte);
  const tonnageJour = acceptes.reduce((s, p) => s + p.tonnage, 0);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.titre, { color: colors.foreground }]}>Arrivées camions</Text>
          <Text style={[styles.date, { color: colors.muted }]}>
            {new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/camion/nouveau' as any)}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats rapides */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{passagesAujourdhui.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Passages</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{acceptes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Acceptés</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error }]}>{refus.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Refus</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{tonnageJour.toFixed(1)} T</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Tonnage</Text>
        </View>
      </View>

      {/* Chantiers actifs */}
      {chantiersAutorises.length > 0 && (
        <View style={[styles.chantiersActifs, { borderBottomColor: colors.border }]}>
          <Text style={[styles.chantiersActifsLabel, { color: colors.muted }]}>Chantiers autorisés :</Text>
          <FlatList
            data={chantiersAutorises}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chantiersActifsList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.chantierTag, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                <Text style={[styles.chantierTagText, { color: colors.success }]} numberOfLines={1}>
                  {item.societe.nom}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Liste des passages */}
      <FlatList
        data={passagesAujourdhui}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PassageItem passage={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="truck.box.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun passage aujourd'hui</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Appuyez sur + pour enregistrer une arrivée
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/camion/nouveau' as any)}
            >
              <IconSymbol name="plus" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Nouvelle arrivée</Text>
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
  date: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 0.5, marginVertical: 4 },
  chantiersActifs: { paddingVertical: 8, borderBottomWidth: 0.5 },
  chantiersActifsLabel: { fontSize: 11, paddingHorizontal: 16, marginBottom: 6 },
  chantiersActifsList: { paddingHorizontal: 16, gap: 8 },
  chantierTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  chantierTagText: { fontSize: 12, fontWeight: '600', maxWidth: 150 },
  liste: { padding: 16, gap: 10 },
  item: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  statutBar: { width: 4 },
  itemContent: { flex: 1, padding: 12, gap: 4 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plaque: { fontSize: 16, fontWeight: '700' },
  heure: { fontSize: 13 },
  chantierNom: { fontSize: 12 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  transporteur: { fontSize: 12 },
  tonnage: { fontSize: 13, fontWeight: '600' },
  refusMotif: { fontSize: 12, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 240 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
