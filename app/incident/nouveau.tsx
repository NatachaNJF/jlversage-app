import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Switch, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { IncidentType } from "@/types";

const TYPES_INCIDENT: { id: IncidentType; label: string; desc: string; color: string }[] = [
  { id: 'camion_refuse', label: 'Camion refusé', desc: 'Refus lors du contrôle administratif ou visuel', color: '#DC2626' },
  { id: 'suspicion_post_deversement', label: 'Suspicion post-déversement', desc: 'Anomalie constatée après déversement', color: '#D97706' },
  { id: 'autre', label: 'Autre incident', desc: 'Tout autre incident sur le site', color: '#6B7280' },
];

export default function NouvelIncident() {
  const colors = useColors();
  const router = useRouter();
  const { chantiers, ajouterIncident } = useApp();

  const [type, setType] = useState<IncidentType>('camion_refuse');
  const [chantierId, setChantierId] = useState('');
  const [description, setDescription] = useState('');
  const [zoneIsolee, setZoneIsolee] = useState(false);
  const [clientInforme, setClientInforme] = useState(false);
  const [saving, setSaving] = useState(false);

  const chantiersActifs = useMemo(
    () => chantiers.filter(c => c.statut !== 'cloture'),
    [chantiers]
  );

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Description requise', 'Veuillez décrire l\'incident.');
      return;
    }
    setSaving(true);
    try {
      const chantier = chantiers.find(c => c.id === chantierId);
      await ajouterIncident({
        type,
        chantierId: chantierId || 'inconnu',
        chantierNom: chantier?.societe.nom || 'Non spécifié',
        date: new Date().toISOString(),
        description: description.trim(),
        zoneIsolee,
        clientInforme,
        resolu: false,
      });
      Alert.alert('Incident enregistré', 'L\'incident a été ajouté au dossier.');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'incident.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nouvel incident</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Type */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Type d'incident</Text>
          {TYPES_INCIDENT.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeOption,
                { borderColor: colors.border, backgroundColor: colors.surface },
                type === t.id && { borderColor: t.color, backgroundColor: t.color + '10' }
              ]}
              onPress={() => setType(t.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.typeIndicator, { backgroundColor: t.color }]} />
              <View style={styles.typeInfo}>
                <Text style={[styles.typeLabel, { color: colors.foreground }]}>{t.label}</Text>
                <Text style={[styles.typeDesc, { color: colors.muted }]}>{t.desc}</Text>
              </View>
              {type === t.id && <IconSymbol name="checkmark.circle.fill" size={20} color={t.color} />}
            </TouchableOpacity>
          ))}

          {/* Chantier */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chantier concerné</Text>
          <View style={styles.chantiersList}>
            {chantiersActifs.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chantierOption,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  chantierId === c.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                ]}
                onPress={() => setChantierId(c.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chantierNom, { color: colors.foreground }]} numberOfLines={1}>
                  {c.societe.nom}
                </Text>
                {chantierId === c.id && <IconSymbol name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Description</Text>
          <TextInput
            style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez l'incident en détail..."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
          />

          {/* Actions */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Actions prises</Text>
          <View style={[styles.actionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Zone isolée</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>La zone de déversement a été isolée</Text>
              </View>
              <Switch value={zoneIsolee} onValueChange={setZoneIsolee} trackColor={{ true: colors.warning }} />
            </View>
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Client informé</Text>
                <Text style={[styles.switchHint, { color: colors.muted }]}>Le client a été contacté</Text>
              </View>
              <Switch value={clientInforme} onValueChange={setClientInforme} trackColor={{ true: colors.success }} />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnSave, { backgroundColor: saving ? colors.muted : colors.error }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color="#fff" />
            <Text style={styles.btnText}>{saving ? 'Enregistrement...' : 'Enregistrer l\'incident'}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 8, overflow: 'hidden',
  },
  typeIndicator: { width: 4, height: '100%', borderRadius: 2, alignSelf: 'stretch', minHeight: 40 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: '600' },
  typeDesc: { fontSize: 12, marginTop: 2 },
  chantiersList: { gap: 8, marginBottom: 4 },
  chantierOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 10, borderWidth: 1.5,
  },
  chantierNom: { fontSize: 14, fontWeight: '500', flex: 1 },
  textarea: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontSize: 15, minHeight: 100, marginBottom: 4,
  },
  actionsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 14, marginBottom: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  switchHint: { fontSize: 11, marginTop: 1 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
