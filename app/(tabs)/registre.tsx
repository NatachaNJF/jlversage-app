import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Platform
} from "react-native";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { getTodayBrussels, getDaysAgoBrussels, formatDateFr } from "@/lib/date";

function PassageRow({ passage }: { passage: any }) {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.rowIndicator, { backgroundColor: passage.accepte ? colors.success : colors.error }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowPlaque, { color: colors.foreground }]}>{passage.plaque}</Text>
          <Text style={[styles.rowHeure, { color: colors.muted }]}>{passage.heure}</Text>
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

type FiltreType = 'aujourd_hui' | 'semaine' | 'mois' | 'date_libre';

export default function RegistreScreen() {
  const colors = useColors();
  const today = getTodayBrussels();
  const weekAgo = getDaysAgoBrussels(7);
  const monthAgo = getDaysAgoBrussels(30);

  const [filtre, setFiltre] = useState<FiltreType>('aujourd_hui');
  const [dateLibre, setDateLibre] = useState(today);
  const [showDateInput, setShowDateInput] = useState(false);

  // Calculer les dates de début/fin selon le filtre
  const { dateDebut, dateFin } = useMemo(() => {
    if (filtre === 'aujourd_hui') return { dateDebut: today, dateFin: today };
    if (filtre === 'semaine') return { dateDebut: weekAgo, dateFin: today };
    if (filtre === 'mois') return { dateDebut: monthAgo, dateFin: today };
    return { dateDebut: dateLibre, dateFin: dateLibre };
  }, [filtre, dateLibre, today, weekAgo, monthAgo]);

  const passagesQuery = trpc.passages.listByPeriod.useQuery(
    { dateDebut, dateFin },
    { enabled: !!dateDebut && !!dateFin }
  );
  const allPassages = passagesQuery.data ?? [];

  const passagesFiltres = useMemo(() => {
    return [...allPassages].sort((a: any, b: any) => {
      const da = (a.date || '') + (a.heure || '');
      const db = (b.date || '') + (b.heure || '');
      return db.localeCompare(da);
    });
  }, [allPassages]);

  const totalAcceptes = passagesFiltres.filter((p: any) => p.accepte).length;
  const totalRefus = passagesFiltres.filter((p: any) => !p.accepte).length;
  const totalTonnage = passagesFiltres.filter((p: any) => p.accepte).reduce((s: number, p: any) => s + Number(p.tonnage), 0);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    passagesFiltres.forEach((p: any) => {
      const key = p.date || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [passagesFiltres]);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === today) return "Aujourd'hui";
    return formatDateFr(dateStr, { withWeekday: true });
  };

  const FILTRES: { label: string; val: FiltreType }[] = [
    { label: "Auj.", val: 'aujourd_hui' },
    { label: '7 j', val: 'semaine' },
    { label: '30 j', val: 'mois' },
    { label: '📅 Date', val: 'date_libre' },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.titre, { color: colors.foreground }]}>Registre</Text>
        <View style={styles.filtreRow}>
          {FILTRES.map(f => (
            <TouchableOpacity
              key={f.val}
              style={[styles.filtreBtn, { borderColor: colors.border, backgroundColor: colors.surface },
                filtre === f.val && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => {
                setFiltre(f.val);
                if (f.val === 'date_libre') setShowDateInput(true);
                else setShowDateInput(false);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.filtreBtnText, { color: filtre === f.val ? '#fff' : colors.muted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sélecteur de date libre */}
        {filtre === 'date_libre' && (
          <View style={[styles.dateInputRow, { borderColor: colors.border }]}>
            <Text style={[styles.dateInputLabel, { color: colors.muted }]}>Date :</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={dateLibre}
                max={today}
                onChange={(e) => setDateLibre(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 15, color: colors.foreground, outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <TextInput
                style={[styles.dateInput, { color: colors.foreground, borderColor: colors.border }]}
                value={dateLibre}
                onChangeText={v => {
                  // Accepter seulement le format YYYY-MM-DD
                  if (/^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(v)) setDateLibre(v);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={10}
              />
            )}
          </View>
        )}
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
      {passagesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={item => item.date}
          contentContainerStyle={styles.liste}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View>
              <View style={styles.dateHeader}>
                <Text style={[styles.dateHeaderText, { color: colors.muted }]}>
                  {formatDateHeader(item.date)}
                </Text>
                <Text style={[styles.dateHeaderCount, { color: colors.muted }]}>
                  {item.items.length} passage{item.items.length > 1 ? 's' : ''}
                </Text>
              </View>
              {item.items.map((p: any) => <PassageRow key={p.id} passage={p} />)}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <IconSymbol name="list.bullet.clipboard.fill" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun passage enregistré</Text>
              {filtre === 'date_libre' && (
                <Text style={[styles.emptySubText, { color: colors.muted }]}>
                  {formatDateFr(dateLibre)}
                </Text>
              )}
            </View>
          }
        />
      )}
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
  dateInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  dateInputLabel: { fontSize: 13, fontWeight: '500' },
  dateInput: { flex: 1, fontSize: 15, borderWidth: 0, padding: 0 },
  resume: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5 },
  resumeItem: { flex: 1, alignItems: 'center', gap: 2 },
  resumeValue: { fontSize: 17, fontWeight: '700' },
  resumeLabel: { fontSize: 11 },
  resumeDivider: { width: 0.5, marginVertical: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
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
  emptySubText: { fontSize: 13 },
});
