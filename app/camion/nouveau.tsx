import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Image
} from "react-native";
import { showAlert, showConfirm } from "@/lib/alert";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { Chantier } from "@/drizzle/schema";
import { MotifRefus, MOTIF_REFUS_LABELS } from "@/types";
import { getNowBrussels } from "@/lib/date";

const ANOMALIES_VISUELLES: { id: MotifRefus; label: string; emoji: string }[] = [
  { id: 'dechets', label: 'Déchets présents', emoji: '🗑' },
  { id: 'gravats', label: 'Gravats', emoji: '🪨' },
  { id: 'plastique', label: 'Plastique', emoji: '♻️' },
  { id: 'odeur_suspecte', label: 'Odeur suspecte', emoji: '👃' },
  { id: 'melange_douteux', label: 'Mélange douteux', emoji: '⚗️' },
  { id: 'couleur_anormale', label: 'Couleur anormale', emoji: '🎨' },
];

export default function NouveauCamion() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const chantiersQuery = trpc.chantiers.list.useQuery();
  const chantiers = chantiersQuery.data || [];
  const createPassageMutation = trpc.passages.create.useMutation({
    onSuccess: () => {
      utils.passages.invalidate();
      utils.chantiers.invalidate();
    },
  });

  const [etape, setEtape] = useState(1);

  // Étape 1 — Contrôle administratif
  const [chantierId, setChantierId] = useState<number | null>(null);
  const [plaque, setPlaque] = useState('');
  const [transporteur, setTransporteur] = useState('');
  const [refChantier, setRefChantier] = useState('');
  const [bonWalterreOk, setBonWalterreOk] = useState<boolean | null>(null);
  const [referenceOk, setReferenceOk] = useState<boolean | null>(null);
  const [plaqueOk, setPlaqueOk] = useState<boolean | null>(null);
  const [correspondanceOk, setCorrespondanceOk] = useState<boolean | null>(null);

  // Étape 2 — Contrôle visuel
  const [controleVisuelOk, setControleVisuelOk] = useState<boolean | null>(null);
  const [anomaliesSelectionnees, setAnomaliesSelectionnees] = useState<MotifRefus[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Étape 3 — Enregistrement
  const [tonnage, setTonnage] = useState('');
  const [accepte, setAccepte] = useState<boolean | null>(null);
  const [motifRefus, setMotifRefus] = useState<MotifRefus | null>(null);
  const [motifDetail, setMotifDetail] = useState('');

  const [saving, setSaving] = useState(false);

  const chantiersAutorises = useMemo(
    () => chantiers.filter((c: Chantier) => c.statut === 'autorise' || c.statut === 'en_cours'),
    [chantiers]
  );

  const chantierSelectionne = useMemo(
    () => chantiers.find((c: Chantier) => c.id === chantierId),
    [chantiers, chantierId]
  );

  const getNowStrings = () => getNowBrussels();

  const adminOk = bonWalterreOk && referenceOk && plaqueOk && correspondanceOk;
  const adminRefus = bonWalterreOk === false || referenceOk === false || plaqueOk === false || correspondanceOk === false;

  const handlePrendrePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission refusée', 'Accès à la caméra nécessaire pour prendre une photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleChoisirPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleAnomalie = (id: MotifRefus) => {
    setAnomaliesSelectionnees(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const validerEtape1 = () => {
    if (!chantierId || !plaque.trim() || !transporteur.trim()) {
      showAlert('Champs requis', 'Veuillez sélectionner un chantier, saisir la plaque et le transporteur.');
      return;
    }
    if (adminRefus) {
      showConfirm(
        'Refus administratif',
        'Un ou plusieurs contrôles administratifs ont échoué. Le camion doit être refusé.',
        () => handleSaveRefus('admin'),
        'Enregistrer le refus',
        true,
      );
      return;
    }
    setEtape(2);
  };

  const validerEtape2 = () => {
    if (controleVisuelOk === null) {
      showAlert('Contrôle requis', 'Veuillez indiquer si le contrôle visuel est OK ou non.');
      return;
    }
    if (!controleVisuelOk && anomaliesSelectionnees.length === 0) {
      showAlert('Anomalie requise', 'Veuillez sélectionner au moins une anomalie constatée.');
      return;
    }
    if (!controleVisuelOk) {
      showConfirm(
        'Refus visuel',
        'Des anomalies visuelles ont été constatées. Le camion doit être refusé.',
        () => handleSaveRefus('visuel'),
        'Enregistrer le refus',
        true,
      );
      return;
    }
    setEtape(3);
  };

  const handleSaveRefus = async (type: 'admin' | 'visuel') => {
    setSaving(true);
    try {
      const now = new Date();
      const motif: MotifRefus = type === 'admin'
        ? (bonWalterreOk === false ? 'bon_walterre_manquant' : referenceOk === false ? 'reference_incorrecte' : 'chantier_non_autorise')
        : (anomaliesSelectionnees[0] || 'autre');

      const { date, heure } = getNowStrings();
      await createPassageMutation.mutateAsync({
        chantierId: chantierId!,
        chantierNom: chantierSelectionne?.societeNom || 'Chantier inconnu',
        date,
        heure,
        plaque: plaque.trim().toUpperCase(),
        transporteur: transporteur.trim(),
        referenceChantier: refChantier.trim(),
        tonnage: 0.001,
        accepte: false,
        motifRefus: motif,
        motifRefusDetail: type === 'visuel' ? anomaliesSelectionnees.map(a => MOTIF_REFUS_LABELS[a]).join(', ') : undefined,
        bonWalterreOk: bonWalterreOk || false,
        referenceOk: referenceOk || false,
        plaqueOk: plaqueOk || false,
        correspondanceOk: correspondanceOk || false,
        controleVisuelOk: type === 'visuel' ? false : undefined,
        anomalies: type === 'visuel' ? anomaliesSelectionnees : undefined,
      });

      showAlert('Refus enregistré', 'Le refus a été enregistré dans le registre.');
      router.back();
    } catch (e: any) {
      showAlert('Erreur', e?.message || 'Impossible d\'enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccepte = async () => {
    if (!tonnage.trim() || isNaN(parseFloat(tonnage))) {
      showAlert('Tonnage requis', 'Veuillez saisir le tonnage.');
      return;
    }
    setSaving(true);
    try {
      const { date, heure } = getNowStrings();
      await createPassageMutation.mutateAsync({
        chantierId: chantierId!,
        chantierNom: chantierSelectionne?.societeNom || 'Chantier inconnu',
        date,
        heure,
        plaque: plaque.trim().toUpperCase(),
        transporteur: transporteur.trim(),
        referenceChantier: refChantier.trim(),
        tonnage: parseFloat(tonnage),
        accepte: true,
        bonWalterreOk: true,
        referenceOk: true,
        plaqueOk: true,
        correspondanceOk: true,
        controleVisuelOk: true,
      });

      showAlert('Camion accepté', 'L\'arrivée a été enregistrée dans le registre.');
      router.back();
    } catch (e: any) {
      showAlert('Erreur', e?.message || 'Impossible d\'enregistrer.');
    } finally {
      setSaving(false);
    }
  };

  const OuiNonBtns = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) => (
    <View style={styles.ouiNonRow}>
      <TouchableOpacity
        style={[styles.ouiNonBtn, { borderColor: colors.border, backgroundColor: colors.background },
          value === true && { backgroundColor: colors.success, borderColor: colors.success }]}
        onPress={() => onChange(true)}
        activeOpacity={0.75}
      >
        <IconSymbol name="checkmark" size={16} color={value === true ? '#fff' : colors.muted} />
        <Text style={[styles.ouiNonText, { color: value === true ? '#fff' : colors.foreground }]}>OK</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.ouiNonBtn, { borderColor: colors.border, backgroundColor: colors.background },
          value === false && { backgroundColor: colors.error, borderColor: colors.error }]}
        onPress={() => onChange(false)}
        activeOpacity={0.75}
      >
        <IconSymbol name="xmark" size={16} color={value === false ? '#fff' : colors.muted} />
        <Text style={[styles.ouiNonText, { color: value === false ? '#fff' : colors.foreground }]}>Refus</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* En-tête */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => etape === 1 ? router.back() : setEtape(etape - 1)} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Arrivée camion</Text>
            <Text style={[styles.headerStep, { color: colors.muted }]}>
              {etape === 1 ? 'Contrôle administratif' : etape === 2 ? 'Contrôle visuel' : 'Enregistrement'}
            </Text>
          </View>
          <View style={styles.stepDots}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.dot, { backgroundColor: etape >= s ? colors.primary : colors.border }]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ÉTAPE 1 — Contrôle administratif */}
          {etape === 1 && (
            <>
              <Text style={[styles.etapeTitre, { color: colors.foreground }]}>Contrôle administratif</Text>

              {/* Sélection chantier */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Chantier autorisé <Text style={{ color: colors.error }}>*</Text></Text>
                {chantiersAutorises.length === 0 ? (
                  <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                    <Text style={[styles.alertText, { color: colors.error }]}>Aucun chantier autorisé actuellement</Text>
                  </View>
                ) : (
                  chantiersAutorises.map((c: Chantier) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chantierOption,
                        { borderColor: chantierId === c.id ? colors.primary : colors.border, backgroundColor: colors.surface },
                        chantierId === c.id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                      ]}
                      onPress={() => {
                        setChantierId(c.id);
                        setRefChantier(c.referenceWalterre || '');
                        setTransporteur(c.transporteurs?.[0] || '');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.chantierOptionLeft}>
                        <Text style={[styles.chantierOptionNom, { color: colors.foreground }]}>{c.societeNom}</Text>
                        <Text style={[styles.chantierOptionRef, { color: colors.muted }]}>{c.referenceWalterre}</Text>
                      </View>
                      {chantierId === c.id && <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Plaque du camion <Text style={{ color: colors.error }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={plaque}
                  onChangeText={t => setPlaque(t.toUpperCase())}
                  placeholder="1-ABC-234"
                  autoCapitalize="characters"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Transporteur <Text style={{ color: colors.error }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={transporteur}
                  onChangeText={setTransporteur}
                  placeholder="Nom du transporteur"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Référence chantier Walterre</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={refChantier}
                  onChangeText={setRefChantier}
                  placeholder="WAL-2026-XXXX"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={[styles.checklistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.checklistTitle, { color: colors.foreground }]}>Vérifications</Text>
                {[
                  { label: 'Bon Walterre présent', value: bonWalterreOk, onChange: setBonWalterreOk },
                  { label: 'Référence chantier correcte', value: referenceOk, onChange: setReferenceOk },
                  { label: 'Plaque correspond au dossier', value: plaqueOk, onChange: setPlaqueOk },
                  { label: 'Chantier autorisé', value: correspondanceOk, onChange: setCorrespondanceOk },
                ].map((item, idx) => (
                  <View key={idx} style={styles.checklistRow}>
                    <Text style={[styles.checklistLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <OuiNonBtns value={item.value} onChange={item.onChange} />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={validerEtape1}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Contrôle visuel →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ÉTAPE 2 — Contrôle visuel */}
          {etape === 2 && (
            <>
              <Text style={[styles.etapeTitre, { color: colors.foreground }]}>Contrôle visuel</Text>
              <Text style={[styles.etapeSub, { color: colors.muted }]}>
                Inspecter visuellement le chargement avant déversement
              </Text>

              <View style={styles.ouiNonGrand}>
                <TouchableOpacity
                  style={[styles.ouiNonGrandBtn, { borderColor: colors.border, backgroundColor: colors.background },
                    controleVisuelOk === true && { backgroundColor: colors.success + '15', borderColor: colors.success }]}
                  onPress={() => { setControleVisuelOk(true); setAnomaliesSelectionnees([]); }}
                  activeOpacity={0.75}
                >
                  <IconSymbol name="checkmark.circle.fill" size={32} color={controleVisuelOk === true ? colors.success : colors.muted} />
                  <Text style={[styles.ouiNonGrandText, { color: controleVisuelOk === true ? colors.success : colors.foreground }]}>
                    Contrôle OK
                  </Text>
                  <Text style={[styles.ouiNonGrandSub, { color: colors.muted }]}>Terre conforme</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ouiNonGrandBtn, { borderColor: colors.border, backgroundColor: colors.background },
                    controleVisuelOk === false && { backgroundColor: colors.error + '15', borderColor: colors.error }]}
                  onPress={() => setControleVisuelOk(false)}
                  activeOpacity={0.75}
                >
                  <IconSymbol name="xmark.circle.fill" size={32} color={controleVisuelOk === false ? colors.error : colors.muted} />
                  <Text style={[styles.ouiNonGrandText, { color: controleVisuelOk === false ? colors.error : colors.foreground }]}>
                    Anomalie
                  </Text>
                  <Text style={[styles.ouiNonGrandSub, { color: colors.muted }]}>Refus immédiat</Text>
                </TouchableOpacity>
              </View>

              {controleVisuelOk === false && (
                <View style={[styles.anomaliesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.checklistTitle, { color: colors.foreground }]}>Anomalies constatées</Text>
                  <View style={styles.anomaliesGrid}>
                    {ANOMALIES_VISUELLES.map(a => (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.anomalieBtn,
                          { borderColor: colors.border, backgroundColor: colors.background },
                          anomaliesSelectionnees.includes(a.id) && { backgroundColor: colors.error + '15', borderColor: colors.error }
                        ]}
                        onPress={() => toggleAnomalie(a.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.anomalieEmoji}>{a.emoji}</Text>
                        <Text style={[styles.anomalieLabel, { color: anomaliesSelectionnees.includes(a.id) ? colors.error : colors.foreground }]}>
                          {a.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Photo */}
              <View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.checklistTitle, { color: colors.foreground }]}>Photo (optionnel)</Text>
                {photoUri ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photoUri }} style={styles.photoImg} />
                    <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.photoRemove}>
                      <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoBtns}>
                    <TouchableOpacity
                      style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={handlePrendrePhoto}
                      activeOpacity={0.75}
                    >
                      <IconSymbol name="camera.fill" size={20} color={colors.primary} />
                      <Text style={[styles.photoBtnText, { color: colors.primary }]}>Caméra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={handleChoisirPhoto}
                      activeOpacity={0.75}
                    >
                      <IconSymbol name="photo.fill" size={20} color={colors.primary} />
                      <Text style={[styles.photoBtnText, { color: colors.primary }]}>Galerie</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: controleVisuelOk === false ? colors.error : colors.primary }]}
                onPress={validerEtape2}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>
                  {controleVisuelOk === false ? 'Enregistrer le refus' : 'Enregistrement →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ÉTAPE 3 — Enregistrement */}
          {etape === 3 && (
            <>
              <Text style={[styles.etapeTitre, { color: colors.foreground }]}>Enregistrement</Text>

              <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.resumeLabel, { color: colors.muted }]}>Chantier</Text>
                <Text style={[styles.resumeValue, { color: colors.foreground }]}>{chantierSelectionne?.societeNom}</Text>
                <Text style={[styles.resumeLabel, { color: colors.muted }]}>Plaque</Text>
                <Text style={[styles.resumeValue, { color: colors.foreground }]}>{plaque}</Text>
                <Text style={[styles.resumeLabel, { color: colors.muted }]}>Transporteur</Text>
                <Text style={[styles.resumeValue, { color: colors.foreground }]}>{transporteur}</Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Tonnage (T) <Text style={{ color: colors.error }}>*</Text></Text>
                <TextInput
                  style={[styles.inputLarge, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={tonnage}
                  onChangeText={setTonnage}
                  placeholder="Ex : 24.5"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.muted}
                />
              </View>

              {chantierSelectionne && (
                <View style={[styles.tonnageInfo, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
                  <Text style={[styles.tonnageInfoText, { color: colors.primary }]}>
                    Tonnage cumulé : {chantierSelectionne.tonnageAccepte.toFixed(1)} T / {chantierSelectionne.volumeDeclare || chantierSelectionne.volumeEstime} T
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btnAccepte, { backgroundColor: colors.success }]}
                onPress={handleSaveAccepte}
                disabled={saving}
                activeOpacity={0.8}
              >
                <IconSymbol name="checkmark.circle.fill" size={22} color="#fff" />
                <Text style={styles.btnText}>{saving ? 'Enregistrement...' : 'Accepter et enregistrer'}</Text>
              </TouchableOpacity>
            </>
          )}

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
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerStep: { fontSize: 12, marginTop: 1 },
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { padding: 16, gap: 4 },
  etapeTitre: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  etapeSub: { fontSize: 13, marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  inputLarge: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 28, fontWeight: '700', textAlign: 'center',
  },
  alertBox: { padding: 12, borderRadius: 8, borderWidth: 1 },
  alertText: { fontSize: 13, fontWeight: '500' },
  chantierOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 8,
  },
  chantierOptionLeft: { flex: 1 },
  chantierOptionNom: { fontSize: 14, fontWeight: '600' },
  chantierOptionRef: { fontSize: 12, marginTop: 2 },
  checklistCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12, marginBottom: 14 },
  checklistTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  checklistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  checklistLabel: { flex: 1, fontSize: 14 },
  ouiNonRow: { flexDirection: 'row', gap: 8 },
  ouiNonBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5,
  },
  ouiNonText: { fontSize: 13, fontWeight: '600' },
  ouiNonGrand: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  ouiNonGrandBtn: {
    flex: 1, alignItems: 'center', gap: 8, padding: 16,
    borderRadius: 12, borderWidth: 2,
  },
  ouiNonGrandText: { fontSize: 15, fontWeight: '700' },
  ouiNonGrandSub: { fontSize: 11 },
  anomaliesCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  anomaliesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  anomalieBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5,
  },
  anomalieEmoji: { fontSize: 16 },
  anomalieLabel: { fontSize: 13, fontWeight: '500' },
  photoCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  photoBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5,
  },
  photoBtnText: { fontSize: 14, fontWeight: '600' },
  photoPreview: { position: 'relative', marginTop: 8 },
  photoImg: { width: '100%', height: 180, borderRadius: 8 },
  photoRemove: { position: 'absolute', top: 8, right: 8 },
  resumeCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14, gap: 4 },
  resumeLabel: { fontSize: 11 },
  resumeValue: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  tonnageInfo: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 14 },
  tonnageInfoText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  btnAccepte: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 12, marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
