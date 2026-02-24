import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { useColors } from "@/hooks/use-colors";
import { ClasseTerre } from "@/types";

function InputField({
  label, value, onChangeText, placeholder, keyboardType, multiline, required
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; required?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}{required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, {
          color: colors.foreground,
          backgroundColor: colors.background,
          borderColor: colors.border,
          height: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        returnKeyType={multiline ? 'default' : 'next'}
      />
    </View>
  );
}

export default function NouveauChantier() {
  const colors = useColors();
  const router = useRouter();
  const { ajouterChantier } = useApp();

  // Étape courante
  const [etape, setEtape] = useState(1);

  // Société
  const [nomSociete, setNomSociete] = useState('');
  const [adresse, setAdresse] = useState('');
  const [tva, setTva] = useState('');
  const [mail, setMail] = useState('');
  const [contact, setContact] = useState('');
  const [telephone, setTelephone] = useState('');

  // Chantier
  const [localisation, setLocalisation] = useState('');
  const [contactChantier, setContactChantier] = useState('');
  const [telChantier, setTelChantier] = useState('');
  const [volume, setVolume] = useState('');
  const [classe, setClasse] = useState<ClasseTerre>(2);
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);

  const validerEtape1 = () => {
    if (!nomSociete.trim() || !contact.trim() || !telephone.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le nom de la société, le contact et le téléphone.');
      return;
    }
    setEtape(2);
  };

  const handleSave = async () => {
    if (!localisation.trim() || !volume.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir la localisation et le volume estimé.');
      return;
    }
    setSaving(true);
    try {
      await ajouterChantier({
        statut: 'demande',
        societe: {
          nom: nomSociete.trim(),
          adresse: adresse.trim(),
          tva: tva.trim(),
          mail: mail.trim(),
          personneContact: contact.trim(),
          telephone: telephone.trim(),
        },
        localisationChantier: localisation.trim(),
        contactChantier: contactChantier.trim() || contact.trim(),
        telephoneChantier: telChantier.trim() || telephone.trim(),
        volumeEstime: parseFloat(volume) || 0,
        classe,
        periodeDebut: periodeDebut.trim() || new Date().toISOString().split('T')[0],
        periodeFin: periodeFin.trim() || '',
        notes: notes.trim(),
      });
      router.back();
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de créer le chantier.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* En-tête */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => etape === 1 ? router.back() : setEtape(1)} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nouveau chantier</Text>
            <Text style={[styles.headerStep, { color: colors.muted }]}>Étape {etape} / 2</Text>
          </View>
          <View style={styles.stepDots}>
            <View style={[styles.dot, { backgroundColor: etape >= 1 ? colors.primary : colors.border }]} />
            <View style={[styles.dot, { backgroundColor: etape >= 2 ? colors.primary : colors.border }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {etape === 1 ? (
            <>
              <Text style={[styles.etapeTitre, { color: colors.foreground }]}>Société cliente</Text>
              <InputField label="Nom de la société" value={nomSociete} onChangeText={setNomSociete} placeholder="Ex : Terrassements Dupont SA" required />
              <InputField label="Adresse" value={adresse} onChangeText={setAdresse} placeholder="Rue, code postal, ville" />
              <InputField label="Numéro de TVA" value={tva} onChangeText={setTva} placeholder="BE0123456789" />
              <InputField label="E-mail" value={mail} onChangeText={setMail} placeholder="contact@societe.be" keyboardType="email-address" />
              <InputField label="Personne de contact" value={contact} onChangeText={setContact} placeholder="Prénom Nom" required />
              <InputField label="Téléphone" value={telephone} onChangeText={setTelephone} placeholder="+32 4xx xx xx xx" keyboardType="phone-pad" required />

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
                onPress={validerEtape1}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>Suivant</Text>
                <IconSymbol name="chevron.right" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.etapeTitre, { color: colors.foreground }]}>Informations chantier</Text>
              <InputField label="Localisation du chantier" value={localisation} onChangeText={setLocalisation} placeholder="Adresse ou description du site" required />
              <InputField label="Contact chantier" value={contactChantier} onChangeText={setContactChantier} placeholder="Responsable sur site" />
              <InputField label="Téléphone chantier" value={telChantier} onChangeText={setTelChantier} placeholder="+32 4xx xx xx xx" keyboardType="phone-pad" />
              <InputField label="Volume estimé (T)" value={volume} onChangeText={setVolume} placeholder="Ex : 5000" keyboardType="numeric" required />

              {/* Classe */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Classe <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View style={styles.classeRow}>
                  {([1, 2, 3, 4, 5] as ClasseTerre[]).map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.classeBtn,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        classe === c && { backgroundColor: c <= 2 ? colors.success : colors.error, borderColor: c <= 2 ? colors.success : colors.error },
                      ]}
                      onPress={() => setClasse(c)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.classeBtnText, { color: classe === c ? '#fff' : colors.foreground }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {classe > 2 && (
                  <Text style={[styles.classeWarning, { color: colors.error }]}>
                    ⚠ Classe {classe} — refus probable (classe max acceptée : 2)
                  </Text>
                )}
              </View>

              <InputField label="Période — début (AAAA-MM-JJ)" value={periodeDebut} onChangeText={setPeriodeDebut} placeholder="2026-03-01" />
              <InputField label="Période — fin (AAAA-MM-JJ)" value={periodeFin} onChangeText={setPeriodeFin} placeholder="2026-09-30" />
              <InputField label="Notes internes" value={notes} onChangeText={setNotes} placeholder="Remarques éventuelles..." multiline />

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: saving ? colors.muted : colors.primary }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                <IconSymbol name="checkmark" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>{saving ? 'Enregistrement...' : 'Créer le chantier'}</Text>
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
  etapeTitre: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  classeRow: { flexDirection: 'row', gap: 10 },
  classeBtn: {
    flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  classeBtnText: { fontSize: 16, fontWeight: '700' },
  classeWarning: { fontSize: 12, marginTop: 6 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
