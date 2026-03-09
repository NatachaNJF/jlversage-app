import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { showAlert } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { getTodayBrussels } from "@/lib/date";

const CLASSES = [1, 2, 3, 4, 5];

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {label}{required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, keyboardType, error, multiline, inputStyle, colors }: any) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        styles.input,
        { backgroundColor: colors.surface, borderColor: error ? '#EF4444' : colors.border, color: colors.foreground },
        inputStyle,
      ]}
    />
  );
}

export default function ModifierChantier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const chantierQuery = trpc.chantiers.get.useQuery({ id: Number(id) });
  const chantier = chantierQuery.data;

  const updateMutation = trpc.chantiers.update.useMutation({
    onSuccess: () => {
      utils.chantiers.get.invalidate({ id: Number(id) });
      utils.chantiers.list.invalidate();
      showAlert('Chantier modifié', 'Les modifications ont été enregistrées.');
      router.back();
    },
    onError: (err: any) => showAlert('Erreur', err.message || 'Impossible de sauvegarder.'),
  });

  // Champs du formulaire
  const [societeNom, setSocieteNom] = useState('');
  const [societeAdresse, setSocieteAdresse] = useState('');
  const [societeTva, setSocieteTva] = useState('');
  const [societeMail, setSocieteMail] = useState('');
  const [societeContact, setSocieteContact] = useState('');
  const [societeTelephone, setSocieteTelephone] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [contactChantier, setContactChantier] = useState('');
  const [telephoneChantier, setTelephoneChantier] = useState('');
  const [volumeEstime, setVolumeEstime] = useState('');
  const [classe, setClasse] = useState(1);
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialiser une seule fois avec les données du chantier
  if (chantier && !initialized) {
    setSocieteNom(chantier.societeNom || '');
    setSocieteAdresse(chantier.societeAdresse || '');
    setSocieteTva(chantier.societeTva || '');
    setSocieteMail(chantier.societeMail || '');
    setSocieteContact(chantier.societeContact || '');
    setSocieteTelephone(chantier.societeTelephone || '');
    setLocalisation(chantier.localisationChantier || '');
    setContactChantier(chantier.contactChantier || '');
    setTelephoneChantier(chantier.telephoneChantier || '');
    setVolumeEstime(chantier.volumeEstime?.toString() || '');
    setClasse(chantier.classe || 1);
    setPeriodeDebut(chantier.periodeDebut || '');
    setPeriodeFin(chantier.periodeFin || '');
    setNotes(chantier.notes || '');
    setInitialized(true);
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

  const phoneBeRegex = /^(\+32|0)[1-9][0-9]{7,8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!societeNom.trim()) e.societeNom = 'Nom requis';
    if (!societeAdresse.trim()) e.societeAdresse = 'Adresse requise';
    if (!societeTva.trim()) e.societeTva = 'TVA requise';
    if (!societeMail.trim()) e.societeMail = 'Email requis';
    else if (!emailRegex.test(societeMail)) e.societeMail = 'Format email invalide';
    if (!societeContact.trim()) e.societeContact = 'Contact requis';
    if (!societeTelephone.trim()) e.societeTelephone = 'Téléphone requis';
    else if (!phoneBeRegex.test(societeTelephone.replace(/\s/g, ''))) e.societeTelephone = 'Format belge requis';
    if (!localisation.trim()) e.localisation = 'Localisation requise';
    if (!contactChantier.trim()) e.contactChantier = 'Contact chantier requis';
    if (!telephoneChantier.trim()) e.telephoneChantier = 'Téléphone chantier requis';
    else if (!phoneBeRegex.test(telephoneChantier.replace(/\s/g, ''))) e.telephoneChantier = 'Format belge requis';
    const vol = parseFloat(volumeEstime);
    if (!volumeEstime.trim() || isNaN(vol) || vol <= 0) e.volumeEstime = 'Volume estimé requis (> 0)';
    if (!periodeDebut.trim()) e.periodeDebut = 'Date de début requise';
    else if (!dateRegex.test(periodeDebut)) e.periodeDebut = 'Format YYYY-MM-DD requis';
    if (!periodeFin.trim()) e.periodeFin = 'Date de fin requise';
    else if (!dateRegex.test(periodeFin)) e.periodeFin = 'Format YYYY-MM-DD requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    updateMutation.mutate({
      id: Number(id),
      data: {
        societeNom: societeNom.trim(),
        societeAdresse: societeAdresse.trim(),
        societeTva: societeTva.trim(),
        societeMail: societeMail.trim().toLowerCase(),
        societeContact: societeContact.trim(),
        societeTelephone: societeTelephone.replace(/\s/g, ''),
        localisationChantier: localisation.trim(),
        contactChantier: contactChantier.trim(),
        telephoneChantier: telephoneChantier.replace(/\s/g, ''),
        volumeEstime: parseFloat(volumeEstime),
        classe,
        periodeDebut,
        periodeFin,
        notes: notes.trim() || undefined,
      },
    });
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Modifier le chantier</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: updateMutation.isPending ? colors.muted : colors.primary }]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Enregistrer</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Coordonnées de la société</Text>

          <Field label="Nom de la société" required error={errors.societeNom}>
            <Input value={societeNom} onChangeText={setSocieteNom} placeholder="Ex: Terrassements Dupont SA" error={errors.societeNom} colors={colors} />
          </Field>
          <Field label="Adresse complète" required error={errors.societeAdresse}>
            <Input value={societeAdresse} onChangeText={setSocieteAdresse} placeholder="Rue, numéro, code postal, ville" error={errors.societeAdresse} multiline colors={colors} />
          </Field>
          <Field label="Numéro TVA" required error={errors.societeTva}>
            <Input value={societeTva} onChangeText={setSocieteTva} placeholder="BE0123456789" error={errors.societeTva} colors={colors} />
          </Field>
          <Field label="Email" required error={errors.societeMail}>
            <Input value={societeMail} onChangeText={setSocieteMail} placeholder="contact@societe.be" keyboardType="email-address" error={errors.societeMail} colors={colors} />
          </Field>
          <Field label="Personne de contact" required error={errors.societeContact}>
            <Input value={societeContact} onChangeText={setSocieteContact} placeholder="Prénom Nom" error={errors.societeContact} colors={colors} />
          </Field>
          <Field label="Téléphone / GSM" required error={errors.societeTelephone}>
            <Input value={societeTelephone} onChangeText={setSocieteTelephone} placeholder="+32 478 12 34 56" keyboardType="phone-pad" error={errors.societeTelephone} colors={colors} />
          </Field>

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Informations du chantier</Text>

          <Field label="Localisation du chantier" required error={errors.localisation}>
            <Input value={localisation} onChangeText={setLocalisation} placeholder="Adresse ou description du site" error={errors.localisation} colors={colors} />
          </Field>
          <Field label="Contact sur chantier" required error={errors.contactChantier}>
            <Input value={contactChantier} onChangeText={setContactChantier} placeholder="Prénom Nom" error={errors.contactChantier} colors={colors} />
          </Field>
          <Field label="Téléphone chantier" required error={errors.telephoneChantier}>
            <Input value={telephoneChantier} onChangeText={setTelephoneChantier} placeholder="+32 478 12 34 56" keyboardType="phone-pad" error={errors.telephoneChantier} colors={colors} />
          </Field>
          <Field label="Volume estimé (T)" required error={errors.volumeEstime}>
            <Input value={volumeEstime} onChangeText={setVolumeEstime} placeholder="Ex: 5000" keyboardType="numeric" error={errors.volumeEstime} colors={colors} />
          </Field>
          <Field label="Classe de terre" required>
            <View style={styles.classeRow}>
              {CLASSES.map(c => (
                <TouchableOpacity key={c} onPress={() => setClasse(c)}
                  style={[styles.classeBtn, { backgroundColor: classe === c ? (c > 2 ? '#EF4444' : colors.primary) : colors.surface, borderColor: classe === c ? (c > 2 ? '#EF4444' : colors.primary) : colors.border }]}>
                  <Text style={[styles.classeBtnText, { color: classe === c ? '#fff' : colors.muted }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Date de début" required error={errors.periodeDebut}>
            {Platform.OS === 'web' ? (
              <View style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.periodeDebut ? '#EF4444' : colors.border, justifyContent: 'center' }]}>
                <input
                  type="date"
                  value={periodeDebut}
                  onChange={(e: any) => setPeriodeDebut(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: 15, color: colors.foreground, outline: 'none', width: '100%', fontFamily: 'inherit' }}
                />
              </View>
            ) : (
              <Input value={periodeDebut} onChangeText={setPeriodeDebut} placeholder="YYYY-MM-DD" error={errors.periodeDebut} colors={colors} />
            )}
          </Field>
          <Field label="Date de fin" required error={errors.periodeFin}>
            {Platform.OS === 'web' ? (
              <View style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.periodeFin ? '#EF4444' : colors.border, justifyContent: 'center' }]}>
                <input
                  type="date"
                  value={periodeFin}
                  min={periodeDebut || getTodayBrussels()}
                  onChange={(e: any) => setPeriodeFin(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: 15, color: colors.foreground, outline: 'none', width: '100%', fontFamily: 'inherit' }}
                />
              </View>
            ) : (
              <Input value={periodeFin} onChangeText={setPeriodeFin} placeholder="YYYY-MM-DD" error={errors.periodeFin} colors={colors} />
            )}
          </Field>

          <Field label="Notes internes (optionnel)">
            <Input value={notes} onChangeText={setNotes} placeholder="Remarques, observations..." multiline inputStyle={{ minHeight: 80, textAlignVertical: 'top' }} colors={colors} />
          </Field>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  errorText: { fontSize: 12, color: '#EF4444' },
  classeRow: { flexDirection: 'row', gap: 8 },
  classeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  classeBtnText: { fontSize: 16, fontWeight: '700' },
});
