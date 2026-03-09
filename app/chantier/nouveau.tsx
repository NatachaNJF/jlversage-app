import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { showAlert, showConfirm } from '@/lib/alert';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';
import { getTodayBrussels } from '@/lib/date';

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

function Input({ value, onChangeText, placeholder, keyboardType, error, multiline, inputStyle }: any) {
  const colors = useColors();
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

export default function NouveauChantierScreen() {
  const { isGestionnaire } = useAuthContext();
  const colors = useColors();
  const utils = trpc.useUtils();

  const createMutation = trpc.chantiers.create.useMutation({
    onSuccess: async (data: any) => {
      await utils.chantiers.list.invalidate();
      if (data.refused) {
        showAlert(
          'Demande refusée automatiquement',
          "La classe de terre déclarée est supérieure à 2. Notre site n'accepte que les classes 1 et 2. Un email de refus a été envoyé au client.",
          () => router.back(),
        );
      } else {
        showAlert('Succès', 'Le dossier a été créé avec succès.', () => router.replace(('/chantier/' + data.id) as any));
      }
    },
    onError: (err: any) => { showAlert('Erreur', err.message); },
  });

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
  const [classe, setClasse] = useState<number>(1);
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const phoneBeRegex = /^(\+32|0)[1-9][0-9]{7,8}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!societeNom.trim()) e.societeNom = 'Nom de la société requis';
    if (!societeAdresse.trim()) e.societeAdresse = 'Adresse requise';
    if (!societeTva.trim()) e.societeTva = 'Numéro TVA requis';
    if (!societeMail.trim()) e.societeMail = 'Email requis';
    else if (!emailRegex.test(societeMail)) e.societeMail = 'Format email invalide (ex: nom@domaine.be)';
    if (!societeContact.trim()) e.societeContact = 'Personne de contact requise';
    if (!societeTelephone.trim()) e.societeTelephone = 'Téléphone requis';
    else if (!phoneBeRegex.test(societeTelephone.replace(/\s/g, ''))) e.societeTelephone = 'Format belge requis (+32XXXXXXXXX ou 0XXXXXXXXX)';
    if (!localisation.trim()) e.localisation = 'Localisation du chantier requise';
    if (!contactChantier.trim()) e.contactChantier = 'Contact sur chantier requis';
    if (!telephoneChantier.trim()) e.telephoneChantier = 'Téléphone chantier requis';
    else if (!phoneBeRegex.test(telephoneChantier.replace(/\s/g, ''))) e.telephoneChantier = 'Format belge requis';
    if (!volumeEstime.trim()) e.volumeEstime = 'Volume estimé requis';
    else if (isNaN(Number(volumeEstime)) || Number(volumeEstime) <= 0) e.volumeEstime = 'Volume doit être un nombre positif';
    if (!periodeDebut.trim()) e.periodeDebut = 'Date de début requise';
    else if (!dateRegex.test(periodeDebut)) e.periodeDebut = 'Format YYYY-MM-DD requis (ex: 2026-03-01)';
    if (!periodeFin.trim()) e.periodeFin = 'Date de fin requise';
    else if (!dateRegex.test(periodeFin)) e.periodeFin = 'Format YYYY-MM-DD requis (ex: 2026-12-31)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (classe > 2) {
      showConfirm(
        'Attention — Classe incompatible',
        `La classe ${classe} n'est pas acceptée (classes 1 et 2 uniquement). Le dossier sera automatiquement refusé. Continuer ?`,
        () => submitData(),
        'Confirmer le refus',
        true,
      );
    } else { submitData(); }
  }

  function submitData() {
    createMutation.mutate({
      societeNom: societeNom.trim(), societeAdresse: societeAdresse.trim(),
      societeTva: societeTva.trim(), societeMail: societeMail.trim(),
      societeContact: societeContact.trim(), societeTelephone: societeTelephone.replace(/\s/g, ''),
      localisationChantier: localisation.trim(), contactChantier: contactChantier.trim(),
      telephoneChantier: telephoneChantier.replace(/\s/g, ''),
      volumeEstime: Number(volumeEstime), classe, periodeDebut, periodeFin,
      notes: notes.trim() || undefined,
    });
  }

  if (!isGestionnaire) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🔒</Text>
          <Text style={[styles.errorMsg, { color: colors.muted }]}>Accès réservé aux gestionnaires</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.backBtnText}>Retour</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Annuler</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nouveau dossier</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || createMutation.isPending ? 0.7 : 1 }]}
        >
          {createMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Créer</Text>}
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {classe > 2 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ Classe {classe} non acceptée — refus automatique + email au client.</Text>
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Coordonnées de la société</Text>
        <Field label="Nom de la société" required error={errors.societeNom}>
          <Input value={societeNom} onChangeText={setSocieteNom} placeholder="Ex: Terrassements Dupont SA" error={errors.societeNom} />
        </Field>
        <Field label="Adresse complète" required error={errors.societeAdresse}>
          <Input value={societeAdresse} onChangeText={setSocieteAdresse} placeholder="Rue, numéro, code postal, ville" error={errors.societeAdresse} multiline />
        </Field>
        <Field label="Numéro TVA" required error={errors.societeTva}>
          <Input value={societeTva} onChangeText={setSocieteTva} placeholder="BE0123456789" error={errors.societeTva} />
        </Field>
        <Field label="Email" required error={errors.societeMail}>
          <Input value={societeMail} onChangeText={setSocieteMail} placeholder="contact@societe.be" keyboardType="email-address" error={errors.societeMail} />
        </Field>
        <Field label="Personne de contact" required error={errors.societeContact}>
          <Input value={societeContact} onChangeText={setSocieteContact} placeholder="Prénom Nom" error={errors.societeContact} />
        </Field>
        <Field label="Téléphone / GSM" required error={errors.societeTelephone}>
          <Input value={societeTelephone} onChangeText={setSocieteTelephone} placeholder="+32 478 12 34 56" keyboardType="phone-pad" error={errors.societeTelephone} />
        </Field>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Informations du chantier</Text>
        <Field label="Localisation du chantier" required error={errors.localisation}>
          <Input value={localisation} onChangeText={setLocalisation} placeholder="Adresse ou description du site" error={errors.localisation} />
        </Field>
        <Field label="Contact sur chantier" required error={errors.contactChantier}>
          <Input value={contactChantier} onChangeText={setContactChantier} placeholder="Prénom Nom" error={errors.contactChantier} />
        </Field>
        <Field label="Téléphone chantier" required error={errors.telephoneChantier}>
          <Input value={telephoneChantier} onChangeText={setTelephoneChantier} placeholder="+32 478 12 34 56" keyboardType="phone-pad" error={errors.telephoneChantier} />
        </Field>
        <Field label="Volume estimé (T)" required error={errors.volumeEstime}>
          <Input value={volumeEstime} onChangeText={setVolumeEstime} placeholder="Ex: 5000" keyboardType="numeric" error={errors.volumeEstime} />
        </Field>
        <Field label="Classe de terre" required>
          <View style={styles.classeRow}>
            {CLASSES.map(c => (
              <Pressable key={c} onPress={() => setClasse(c)}
                style={[styles.classeBtn, { backgroundColor: classe === c ? (c > 2 ? '#EF4444' : colors.primary) : colors.surface, borderColor: classe === c ? (c > 2 ? '#EF4444' : colors.primary) : colors.border }]}>
                <Text style={[styles.classeBtnText, { color: classe === c ? '#fff' : colors.muted }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          {classe > 2 && <Text style={styles.classeWarning}>Classes 3, 4, 5 → refus automatique</Text>}
        </Field>
        <Field label="Date de début" required error={errors.periodeDebut}>
          {Platform.OS === 'web' ? (
            <View style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.periodeDebut ? '#EF4444' : colors.border, justifyContent: 'center' }]}>
              <input
                type="date"
                value={periodeDebut}
                min={getTodayBrussels()}
                onChange={(e: any) => setPeriodeDebut(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: 15, color: colors.foreground, outline: 'none', width: '100%', fontFamily: 'inherit' }}
              />
            </View>
          ) : (
            <Input value={periodeDebut} onChangeText={setPeriodeDebut} placeholder="YYYY-MM-DD (ex: 2026-03-01)" error={errors.periodeDebut} />
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
            <Input value={periodeFin} onChangeText={setPeriodeFin} placeholder="YYYY-MM-DD (ex: 2026-12-31)" error={errors.periodeFin} />
          )}
        </Field>
        <Field label="Notes internes (optionnel)">
          <Input value={notes} onChangeText={setNotes} placeholder="Remarques, observations..." multiline inputStyle={{ minHeight: 80, textAlignVertical: 'top' }} />
        </Field>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  cancelText: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  errorText: { fontSize: 12, color: '#EF4444' },
  classeRow: { flexDirection: 'row', gap: 8 },
  classeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  classeBtnText: { fontSize: 16, fontWeight: '700' },
  classeWarning: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  warningBox: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  warningText: { fontSize: 13, color: '#DC2626', lineHeight: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorMsg: { fontSize: 16, textAlign: 'center' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
