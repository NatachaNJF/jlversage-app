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
  const [bonCommandeSigne, setBonCommandeSigne] = useState(false);
  const [planningVersages, setPlanningVersages] = useState<{date: string; tonnagePrev: string; notes: string}[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialiser les champs avec les données existantes (une seule fois)
  if (chantier && !initialized && transporteursList.length > 0) {
    setRefWalterre(chantier.referenceWalterre || '');
    setVolumeDeclare(chantier.volumeDeclare?.toString() || '');
    setRegime(chantier.regimeApplicable || '');
    setBonCommandeSigne(!!(chantier as any).bonCommandeSigne);
    if ((chantier as any).planningVersages) {
      try {
        const saved = typeof (chantier as any).planningVersages === 'string'
          ? JSON.parse((chantier as any).planningVersages)
          : (chantier as any).planningVersages;
        if (Array.isArray(saved)) setPlanningVersages(saved.map((r: any) => ({ date: r.date || '', tonnagePrev: String(r.tonnagePrev || ''), notes: r.notes || '' })));
      } catch {}
    }
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

  function addPlanningRow() {
    setPlanningVersages(prev => [...prev, { date: '', tonnagePrev: '', notes: '' }]);
  }

  function updatePlanningRow(idx: number, field: 'date' | 'tonnagePrev' | 'notes', value: string) {
    setPlanningVersages(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function removePlanningRow(idx: number) {
    setPlanningVersages(prev => prev.filter((_, i) => i !== idx));
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
      bonCommandeSigne,
      planningVersages: planningVersages
        .filter(r => r.date.trim())
        .map(r => ({ date: r.date.trim(), tonnagePrev: parseFloat(r.tonnagePrev) || 0, notes: r.notes.trim() })),
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

          {/* Bon de commande signé */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documents administratifs</Text>

          <TouchableOpacity
            onPress={() => setBonCommandeSigne(v => !v)}
            style={[styles.checkRow, { backgroundColor: colors.surface, borderColor: bonCommandeSigne ? colors.primary : colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { borderColor: bonCommandeSigne ? colors.primary : colors.border, backgroundColor: bonCommandeSigne ? colors.primary : 'transparent' }]}>
              {bonCommandeSigne ? <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.checkLabel, { color: colors.foreground }]}>Bon de commande signé</Text>
              <Text style={[styles.checkSub, { color: colors.muted }]}>Le client a signé et retourné le bon de commande</Text>
            </View>
          </TouchableOpacity>

          {/* Bon de transport Walterre */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Bon de transport Walterre</Text>

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

          {/* Planning versages prévus par jour */}
          <View style={[styles.planningHeader]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, flex: 1, marginBottom: 0 }]}>Versages prévus par jour</Text>
            <TouchableOpacity onPress={addPlanningRow} style={[styles.addRowBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.addRowBtnText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          {planningVersages.length === 0 ? (
            <View style={[styles.emptyPlanning, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyPlanningText, { color: colors.muted }]}>Aucun versage prévu planifié. Appuyez sur "+ Ajouter" pour encoder les jours de versage prévus.</Text>
            </View>
          ) : (
            <View style={styles.planningTable}>
              {/* En-tête */}
              <View style={[styles.planningRow, styles.planningHeaderRow, { backgroundColor: colors.surface }]}>
                <Text style={[styles.planningColHeader, { color: colors.muted, flex: 2 }]}>Date</Text>
                <Text style={[styles.planningColHeader, { color: colors.muted, flex: 1.5 }]}>Tonnage (T)</Text>
                <Text style={[styles.planningColHeader, { color: colors.muted, flex: 2 }]}>Notes</Text>
                <View style={{ width: 28 }} />
              </View>
              {planningVersages.map((row, idx) => (
                <View key={idx} style={[styles.planningRow, { borderColor: colors.border }]}>
                  {Platform.OS === 'web' ? (
                    <View style={[styles.planningCell, { flex: 2 }]}>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e: any) => updatePlanningRow(idx, 'date', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: colors.foreground, outline: 'none', width: '100%', fontFamily: 'inherit' }}
                      />
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.planningInput, { flex: 2, color: colors.foreground }]}
                      value={row.date}
                      onChangeText={v => updatePlanningRow(idx, 'date', v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.muted}
                    />
                  )}
                  <TextInput
                    style={[styles.planningInput, { flex: 1.5, color: colors.foreground }]}
                    value={row.tonnagePrev}
                    onChangeText={v => updatePlanningRow(idx, 'tonnagePrev', v)}
                    placeholder="Ex: 200"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.planningInput, { flex: 2, color: colors.foreground }]}
                    value={row.notes}
                    onChangeText={v => updatePlanningRow(idx, 'notes', v)}
                    placeholder="Optionnel"
                    placeholderTextColor={colors.muted}
                  />
                  <TouchableOpacity onPress={() => removePlanningRow(idx)} style={styles.removeRowBtn}>
                    <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Transporteurs depuis la base */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Transporteurs autorisés</Text>

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
  // Bon de commande signé
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 16 },
  checkLabel: { fontSize: 15, fontWeight: '600' },
  checkSub: { fontSize: 12, marginTop: 2 },
  // Planning versages
  planningHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  addRowBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addRowBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyPlanning: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16 },
  emptyPlanningText: { fontSize: 13, lineHeight: 18 },
  planningTable: { borderRadius: 10, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  planningRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, minHeight: 44 },
  planningHeaderRow: { paddingHorizontal: 8, paddingVertical: 8 },
  planningColHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  planningCell: { paddingHorizontal: 8, paddingVertical: 10 },
  planningInput: { paddingHorizontal: 8, paddingVertical: 10, fontSize: 13, borderRightWidth: 0.5, borderColor: '#E5E7EB', minHeight: 44 },
  removeRowBtn: { width: 28, alignItems: 'center', justifyContent: 'center' },
});
