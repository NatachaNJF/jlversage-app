import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { showAlert } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function DocumentsChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const transporteursQuery = trpc.transporteurs.list.useQuery();

  const saisirDocsMutation = trpc.chantiers.saisirDocuments.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Documents enregistrés', 'Le dossier passe en validation administrative.');
      router.back();
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de sauvegarder.'),
  });

  const chantier = chantierQuery.data;
  const transporteursList: any[] = transporteursQuery.data ?? [];

  const [refWalterre, setRefWalterre] = useState('');
  const [volumeDeclare, setVolumeDeclare] = useState('');
  const [regime, setRegime] = useState('');
  const [selectedTransporteurs, setSelectedTransporteurs] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialiser les champs avec les données existantes (une seule fois)
  if (chantier && !initialized && transporteursList.length > 0) {
    setRefWalterre(chantier.referenceWalterre || '');
    setVolumeDeclare(chantier.volumeDeclare?.toString() || '');
    setRegime(chantier.regimeApplicable || '');
    // Pré-sélectionner les transporteurs déjà enregistrés
    if (chantier.transporteurs) {
      try {
        const saved: string[] = typeof chantier.transporteurs === 'string'
          ? JSON.parse(chantier.transporteurs)
          : chantier.transporteurs;
        const ids = transporteursList
          .filter((t: any) => saved.includes(t.nom))
          .map((t: any) => t.id);
        setSelectedTransporteurs(ids);
      } catch {}
    }
    setInitialized(true);
  }

  function toggleTransporteur(tid: number) {
    setSelectedTransporteurs(prev =>
      prev.includes(tid) ? prev.filter(x => x !== tid) : [...prev, tid]
    );
  }

  if (chantierQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!chantier) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Chantier introuvable</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSave = () => {
    if (!refWalterre.trim()) {
      showAlert('Référence requise', 'Veuillez saisir le numéro du bon de transport Walterre.');
      return;
    }
    const volNum = parseFloat(volumeDeclare);
    if (!volumeDeclare.trim() || isNaN(volNum) || volNum <= 0) {
      showAlert('Volume requis', 'Veuillez saisir un volume déclaré valide.');
      return;
    }
    if (!regime.trim()) {
      showAlert('Régime requis', 'Veuillez saisir le régime applicable.');
      return;
    }
    if (selectedTransporteurs.length === 0) {
      showAlert('Transporteurs requis', 'Sélectionnez au moins un transporteur autorisé.');
      return;
    }
    const nomsTransporteurs = transporteursList
      .filter((t: any) => selectedTransporteurs.includes(t.id))
      .map((t: any) => t.nom);

    saisirDocsMutation.mutate({
      id: Number(id),
      referenceWalterre: refWalterre.trim(),
      volumeDeclare: volNum,
      regimeApplicable: regime.trim(),
      transporteurs: nomsTransporteurs,
      certificatQualite: true,
      rapportAnalyse: true,
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Documents Walterre</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Récap chantier */}
          <View style={[styles.recapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.recapNom, { color: colors.foreground }]}>{chantier.societeNom}</Text>
            <Text style={[styles.recapInfo, { color: colors.muted }]}>
              {chantier.localisationChantier} · Classe {chantier.classe} · {Number(chantier.volumeEstime).toFixed(0)} T estimé
            </Text>
          </View>

          {/* Bon de transport Walterre */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bon de transport Walterre</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Numéro du bon de transport <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={refWalterre}
              onChangeText={setRefWalterre}
              placeholder="Ex: WT-2026-00123"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Volume déclaré (T) <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={volumeDeclare}
              onChangeText={setVolumeDeclare}
              placeholder={Number(chantier.volumeEstime).toFixed(0)}
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Régime applicable <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={regime}
              onChangeText={setRegime}
              placeholder="Ex: Régime I / II / III"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Transporteurs depuis la base */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transporteurs autorisés</Text>

          {transporteursQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : transporteursList.length === 0 ? (
            <View style={[styles.emptyTransp, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyTranspText, { color: colors.muted }]}>
                Aucun transporteur enregistré.
              </Text>
              <TouchableOpacity onPress={() => router.push('/transporteur' as any)}>
                <Text style={[styles.emptyTranspLink, { color: colors.primary }]}>
                  → Gérer les transporteurs dans les paramètres
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transpList}>
              {transporteursList.map((t: any) => {
                const selected = selectedTransporteurs.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => toggleTransporteur(t.id)}
                    style={[
                      styles.transpItem,
                      {
                        backgroundColor: selected ? colors.primary + '15' : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <View style={[styles.checkbox, {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : 'transparent'
                    }]}>
                      {selected ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.transpNom, { color: colors.foreground }]}>{t.nom}</Text>
                      {t.telephone ? <Text style={[styles.transpDetail, { color: colors.muted }]}>{t.telephone}</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[styles.btnSave, { backgroundColor: saisirDocsMutation.isPending ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={saisirDocsMutation.isPending}
            activeOpacity={0.8}
          >
            {saisirDocsMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol name="checkmark" size={18} color="#fff" />
                <Text style={styles.btnText}>Enregistrer et passer en validation</Text>
              </>
            )}
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
  recapCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16, gap: 4 },
  recapNom: { fontSize: 15, fontWeight: '600' },
  recapInfo: { fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  emptyTransp: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 8, marginBottom: 16 },
  emptyTranspText: { fontSize: 14 },
  emptyTranspLink: { fontSize: 14, fontWeight: '600' },
  transpList: { gap: 8, marginBottom: 16 },
  transpItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1.5, padding: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  transpNom: { fontSize: 15, fontWeight: '600' },
  transpDetail: { fontSize: 13 },
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
