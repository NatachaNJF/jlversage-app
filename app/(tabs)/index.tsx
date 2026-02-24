import { ScrollView, Text, View, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { STATUT_LABELS, STATUT_COLORS, ChantierStatut } from "@/types";

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: any }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function ChantierCard({ chantier, onPress }: { chantier: any; onPress: () => void }) {
  const colors = useColors();
  const statutColor = STATUT_COLORS[chantier.statut as ChantierStatut] || colors.muted;
  const pct = chantier.volumeDeclare
    ? Math.min(100, Math.round((chantier.tonnageAccepte / chantier.volumeDeclare) * 100))
    : 0;

  return (
    <TouchableOpacity
      style={[styles.chantierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.chantierHeader}>
        <View style={styles.chantierTitleRow}>
          <Text style={[styles.chantierNom, { color: colors.foreground }]} numberOfLines={1}>
            {chantier.societe.nom}
          </Text>
          <View style={[styles.statutBadge, { backgroundColor: statutColor + '20' }]}>
            <Text style={[styles.statutText, { color: statutColor }]}>
              {STATUT_LABELS[chantier.statut as ChantierStatut]}
            </Text>
          </View>
        </View>
        <Text style={[styles.chantierLoc, { color: colors.muted }]} numberOfLines={1}>
          {chantier.localisationChantier}
        </Text>
      </View>
      {chantier.tonnageAccepte > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>
              {chantier.tonnageAccepte.toFixed(1)} T acceptées
            </Text>
            <Text style={[styles.progressPct, { color: colors.primary }]}>{pct}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pct >= 90 ? '#DC2626' : colors.primary }]} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TableauDeBord() {
  const colors = useColors();
  const router = useRouter();
  const { chantiers, passages, incidents, profil, refreshChantiers, refreshPassages } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshChantiers(), refreshPassages()]);
    setRefreshing(false);
  }, [refreshChantiers, refreshPassages]);

  const today = new Date().toISOString().split('T')[0];
  const passagesAujourdhui = passages.filter(p => p.date.startsWith(today));
  const tonnageJour = passagesAujourdhui.filter(p => p.accepte).reduce((s, p) => s + p.tonnage, 0);
  const refusJour = passagesAujourdhui.filter(p => !p.accepte).length;
  const chantiersActifs = chantiers.filter(c => c.statut === 'autorise' || c.statut === 'en_cours');
  const alertes = chantiers.filter(c => c.statut === 'volume_atteint' || c.statut === 'validation_admin');
  const incidentsOuverts = incidents.filter(i => !i.resolu);

  const dateAffichage = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>Bonjour, {profil.nom}</Text>
            <Text style={[styles.siteName, { color: colors.foreground }]}>{profil.siteNom}</Text>
            <Text style={[styles.dateText, { color: colors.muted }]}>{dateAffichage}</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/chantier/nouveau' as any)}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Alertes */}
        {alertes.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#D97706" />
            <Text style={[styles.alertText, { color: '#92400E' }]}>
              {alertes.length} chantier{alertes.length > 1 ? 's' : ''} nécessite{alertes.length > 1 ? 'nt' : ''} votre attention
            </Text>
            <TouchableOpacity onPress={() => router.push('/chantiers' as any)}>
              <Text style={{ color: '#D97706', fontWeight: '600', fontSize: 13 }}>Voir</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats du jour */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Aujourd'hui</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Camions" value={passagesAujourdhui.length} color={colors.primary} icon="truck.box.fill" />
          <StatCard label="Tonnage" value={`${tonnageJour.toFixed(1)} T`} color={colors.success} icon="scalemass.fill" />
          <StatCard label="Refus" value={refusJour} color={colors.error} icon="xmark.circle.fill" />
          <StatCard label="Incidents" value={incidentsOuverts.length} color={colors.warning} icon="exclamationmark.triangle.fill" />
        </View>

        {/* Chantiers actifs */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chantiers actifs</Text>
          <TouchableOpacity onPress={() => router.push('/chantiers' as any)}>
            <Text style={[styles.voirTout, { color: colors.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {chantiersActifs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="folder.fill" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun chantier actif</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { borderColor: colors.primary }]}
              onPress={() => router.push('/chantier/nouveau' as any)}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Nouveau chantier</Text>
            </TouchableOpacity>
          </View>
        ) : (
          chantiersActifs.slice(0, 3).map(c => (
            <ChantierCard
              key={c.id}
              chantier={c}
              onPress={() => router.push(`/chantier/${c.id}` as any)}
            />
          ))
        )}

        {/* Raccourcis rapides */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/camion/nouveau' as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="truck.box.fill" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>Arrivée camion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/chantier/nouveau' as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.success + '15' }]}>
              <IconSymbol name="plus.circle.fill" size={22} color={colors.success} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>Nouveau chantier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/registre' as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.warning + '15' }]}>
              <IconSymbol name="list.bullet.clipboard.fill" size={22} color={colors.warning} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>Registre du jour</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, marginBottom: 2 },
  siteName: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  dateText: { fontSize: 13 },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  voirTout: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '44%', padding: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  chantierCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  chantierHeader: { gap: 4, marginBottom: 8 },
  chantierTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chantierNom: { flex: 1, fontSize: 14, fontWeight: '600' },
  chantierLoc: { fontSize: 12 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statutText: { fontSize: 11, fontWeight: '600' },
  progressContainer: { gap: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11 },
  progressPct: { fontSize: 11, fontWeight: '600' },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  emptyCard: {
    borderRadius: 12, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 10, marginBottom: 10,
  },
  emptyText: { fontSize: 14 },
  emptyBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  emptyBtnText: { fontSize: 13, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 14,
    alignItems: 'center', gap: 8,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
