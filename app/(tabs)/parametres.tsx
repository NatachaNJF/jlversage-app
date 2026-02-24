import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { RoleProfil } from "@/types";

export default function ParametresScreen() {
  const colors = useColors();
  const { profil, setProfil } = useApp();

  const [nom, setNom] = useState(profil.nom);
  const [role, setRole] = useState<RoleProfil>(profil.role);
  const [siteNom, setSiteNom] = useState(profil.siteNom);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setProfil({ nom: nom.trim() || 'Utilisateur', role, siteNom: siteNom.trim() || 'Site de Transinne' });
      Alert.alert('Enregistré', 'Vos paramètres ont été mis à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.titre, { color: colors.foreground }]}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profil */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mon profil</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nom</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={nom}
              onChangeText={setNom}
              placeholder="Votre nom"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nom du site</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={siteNom}
              onChangeText={setSiteNom}
              placeholder="Site de Transinne"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* Rôle */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mon rôle</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.roleOption,
              { borderColor: colors.border, backgroundColor: colors.background },
              role === 'gestionnaire' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => setRole('gestionnaire')}
            activeOpacity={0.75}
          >
            <View style={[styles.roleIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="chart.bar.fill" size={22} color={colors.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleNom, { color: colors.foreground }]}>Gestionnaire</Text>
              <Text style={[styles.roleDesc, { color: colors.muted }]}>
                Gestion des dossiers, validation administrative, suivi des tonnages et facturation
              </Text>
            </View>
            {role === 'gestionnaire' && (
              <IconSymbol name="checkmark.circle.fill" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption,
              { borderColor: colors.border, backgroundColor: colors.background },
              role === 'prepose' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => setRole('prepose')}
            activeOpacity={0.75}
          >
            <View style={[styles.roleIcon, { backgroundColor: colors.warning + '20' }]}>
              <IconSymbol name="truck.box.fill" size={22} color={colors.warning} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleNom, { color: colors.foreground }]}>Préposé</Text>
              <Text style={[styles.roleDesc, { color: colors.muted }]}>
                Contrôle des camions sur site, enregistrement des arrivées et tenue du registre
              </Text>
            </View>
            {role === 'prepose' && (
              <IconSymbol name="checkmark.circle.fill" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Informations légales */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>À propos</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Application</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>SiteVerseur</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Site verseur</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>Transinne</Text>
          </View>
          <View style={[styles.infoNote, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.warning} />
            <Text style={[styles.infoNoteText, { color: colors.warning }]}>
              Rappel : aucun camion sans validation écrite. Registre tenu en temps réel. Refus assumé sans discussion.
            </Text>
          </View>
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity
          style={[styles.btnSave, { backgroundColor: saving ? colors.muted : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <IconSymbol name="checkmark" size={18} color="#fff" />
          <Text style={styles.btnSaveText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  titre: { fontSize: 22, fontWeight: '700' },
  scroll: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, borderWidth: 1.5,
  },
  roleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1 },
  roleNom: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  roleDesc: { fontSize: 12, lineHeight: 17 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 4,
  },
  infoNoteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  btnSaveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
