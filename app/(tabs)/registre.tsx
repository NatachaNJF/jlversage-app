import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

function PassageRow({ passage }: { passage: any }) {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.rowIndicator, { backgroundColor: passage.accepte ? colors.success : colors.error }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowPlaque, { color: colors.foreground }]}>{passage.plaque}</Text>
          <Text style={[styles.rowHeure, { color: colors.muted }]}>{passage.heureArrivee}</Text>
          {passage.accepte ? (
            <Text style={[styles.rowTonnage, { color: colors.success }]}>{Number(passage.tonnage).toFixed(1)} T</Text>
          ) : (
            <View style={[styles.refusBadge, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.refusBadgeText, { color: colors.error }]}>Refusé</Text>
            </View>
          )}
        </View>
        <Text style={[styles.rowChantier, { color: colors.muted }]} numberOfLines={1}>
          {passage.chantierNom}
        </Text>
        {!passage.accepte && passage.motifRefus && (
          <Text style={[styles.rowMotif, { color: colors.error }]}>
            {passage.motifRefus}
          </Text>
        )}
        <View style={styles.rowMeta}>
          <Text style={[styles.rowMetaText, { color: colors.muted }]}>{passage.transporteur}</Text>
          {passage.operateurNom && (
            <Text style={[styles.rowMetaText, { color: colors.muted }]}>· {passage.operateurNom}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function RegistreScreen() {
  const colors = useColors();
  const [dateFiltre, setDateFiltre] = useState<'aujourd_hui' | 'semaine' | 'tout'>('aujourd_hui');

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const passagesQuery = trpc.passages.list.useQuery();
  const allPassages = passagesQuery.data ?? [];

  const passagesFiltres = useMemo(() => {
    return allPassages.filter((p: any) => {
      if (dateFiltre === 'aujourd_hui') return p.datePassage === today;
      if (dateFiltre === 'semaine') return p.datePassage >= weekAgo;
      return true;
    }).sort((a: any, b: any) => {
      const da = a.datePassage + (a.heureArrivee || '');
      const db = b.datePassage + (b.heureArrivee || '');
      return db.localeCompare(da);
    });
  }, [allPassages, dateFiltre, today, weekAgo]);

  const totalAcceptes = passagesFiltres.filter((p: any) => p.accepte).length;
  const totalRefus = passagesFiltres.filter((p: any) => !p.accepte).length;
  const totalTonnage = passagesFiltres.filter((p: any) => p.accepte).reduce((s: number, p: any) => s + Number(p.tonnage), 0);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    passagesFiltres.forEach((p: any) => {
      const key = p.datePassage;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [passagesFiltres]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (dateStr === today) return "Aujourd'hui";
    return d.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.titre, { color: colors.foreground }]}>Registre</Text>
        <View style={styles.filtreRow}>
          {([
            { label: "Aujourd'hui", val: 'aujourd_hui' as const },
            { label: '7 jours', val: 'semaine' as const },
            { label: 'Tout', val: 'tout' as const },
          ]).map(f => (
            <TouchableOpacity
              key={f.val}
              style={[styles.filtreBtn, { borderColor: colors.border, backgroundColor: colors.surface },
                dateFiltre === f.val && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setDateFiltre(f.val)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filtreBtnText, { color: dateFiltre === f.val ? '#fff' : colors.muted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Résumé */}
      <View style={[styles.resume, { borderBottomColor: colors.border }]}>
        <View style={styles.resumeItem}>
          <Text style={[styles.resumeValue, { color: colors.foreground }]}>{passagesFiltres.length}</Text>
          <Text style={[styles.resumeLabel, { color: colors.muted }]}>Passages</Text>
        </View>
        <View style={[styles.resumeDivider, { backgroundColor: colors.border }]} />
        <View style={styles.resumeItem}>
          <Text style={[styles.resumeValue, { color: colors.success }]}>{totalAcceptes}</Text>
          <Text style={[styles.resumeLabel, { color: colors.muted }]}>Acceptés</Text>
        </View>
        <View style={[styles.resumeDivider, { backgroundColor: colors.border }]} />
        <View style={styles.resumeItem}>
          <Text style={[styles.resumeValue, { color: colors.error }]}>{totalRefus}</Text>
          <Text style={[styles.resumeLabel, { color: colors.muted }]}>Refus</Text>
        </View>
        <View style={[styles.resumeDivider, { backgroundColor: colors.border }]} />
        <View style={styles.resumeItem}>
          <Text style={[styles.resumeValue, { color: colors.primary }]}>{totalTonnage.toFixed(1)} T</Text>
          <Text style={[styles.resumeLabel, { color: colors.muted }]}>Tonnage</Text>
        </View>
      </View>

      {/* Liste groupée par date */}
      <FlatList
        data={grouped}
        keyExtractor={item => item.date}
        contentContainerStyle={styles.liste}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View>
            <View style={styles.dateHeader}>
              <Text style={[styles.dateHeaderText, { color: colors.muted }]}>
                {formatDate(item.date)}
              </Text>
              <Text style={[styles.dateHeaderCount, { color: colors.muted }]}>
                {item.items.length} passage{item.items.length > 1 ? 's' : ''}
              </Text>
            </View>
            {item.items.map(p => <PassageRow key={p.id} passage={p} />)}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="list.bullet.clipboard.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun passage enregistré</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 0.5, gap: 10,
  },
  titre: { fontSize: 22, fontWeight: '700' },
  filtreRow: { flexDirection: 'row', gap: 8 },
  filtreBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filtreBtnText: { fontSize: 12, fontWeight: '500' },
  resume: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5 },
  resumeItem: { flex: 1, alignItems: 'center', gap: 2 },
  resumeValue: { fontSize: 17, fontWeight: '700' },
  resumeLabel: { fontSize: 11 },
  resumeDivider: { width: 0.5, marginVertical: 4 },
  liste: { padding: 16, gap: 0 },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, marginBottom: 6,
  },
  dateHeaderText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  dateHeaderCount: { fontSize: 12 },
  row: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  rowIndicator: { width: 4 },
  rowContent: { flex: 1, padding: 10, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowPlaque: { fontSize: 14, fontWeight: '700', flex: 1 },
  rowHeure: { fontSize: 12 },
  rowTonnage: { fontSize: 13, fontWeight: '600' },
  refusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  refusBadgeText: { fontSize: 11, fontWeight: '600' },
  rowChantier: { fontSize: 12 },
  rowMotif: { fontSize: 12, fontWeight: '500' },
  rowMeta: { flexDirection: 'row', gap: 4, marginTop: 2 },
  rowMetaText: { fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15 },
});
