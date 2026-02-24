import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  camion_refuse: 'Camion refusé',
  suspicion_post_deversement: 'Suspicion post-déversement',
  autre: 'Autre incident',
};

const INCIDENT_TYPE_COLORS: Record<string, string> = {
  camion_refuse: '#DC2626',
  suspicion_post_deversement: '#D97706',
  autre: '#6B7280',
};

export default function IncidentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { incidents, modifierIncident } = useApp();

  const incident = useMemo(() => incidents.find(i => i.id === id), [incidents, id]);

  if (!incident) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Incident introuvable</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, marginTop: 12 }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const typeColor = INCIDENT_TYPE_COLORS[incident.type] || colors.muted;

  const handleResoudre = () => {
    Alert.alert(
      'Résoudre l\'incident',
      'Marquer cet incident comme résolu ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Résoudre',
          onPress: () => modifierIncident(incident.id, {
            resolu: true,
            dateResolution: new Date().toISOString(),
          }),
        },
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Incident</Text>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
            {INCIDENT_TYPE_LABELS[incident.type]}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {incident.resolu && (
          <View style={[styles.resoluBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
            <Text style={[styles.resoluText, { color: colors.success }]}>
              Résolu le {incident.dateResolution ? new Date(incident.dateResolution).toLocaleDateString('fr-BE') : ''}
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Informations</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Date</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {new Date(incident.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Chantier</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{incident.chantierNom}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Description</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{incident.description}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Actions</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Zone isolée</Text>
            <Switch
              value={incident.zoneIsolee || false}
              onValueChange={v => modifierIncident(incident.id, { zoneIsolee: v })}
              trackColor={{ true: colors.warning }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Client informé</Text>
            <Switch
              value={incident.clientInforme || false}
              onValueChange={v => modifierIncident(incident.id, { clientInforme: v })}
              trackColor={{ true: colors.success }}
            />
          </View>
        </View>

        {!incident.resolu && (
          <TouchableOpacity
            style={[styles.btnResoudre, { backgroundColor: colors.success }]}
            onPress={handleResoudre}
            activeOpacity={0.8}
          >
            <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />
            <Text style={styles.btnText}>Marquer comme résolu</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  scroll: { padding: 16, gap: 12 },
  resoluBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  resoluText: { fontSize: 13, fontWeight: '500' },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  description: { fontSize: 14, lineHeight: 21 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14 },
  btnResoudre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
