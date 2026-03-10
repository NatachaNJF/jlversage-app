import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'expo-router';
import { showConfirm } from '@/lib/alert';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function isSameDay(a: string, b: string) {
  return a === b;
}

export default function FermeturesScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: fermetures = [], isLoading } = trpc.fermetures.list.useQuery();
  const createMutation = trpc.fermetures.create.useMutation({
    onSuccess: () => {
      utils.fermetures.list.invalidate();
      setForm({ dateDebut: '', dateFin: '', motif: '' });
    },
    onError: (err) => Alert.alert('Erreur', err.message),
  });
  const deleteMutation = trpc.fermetures.delete.useMutation({
    onSuccess: () => utils.fermetures.list.invalidate(),
    onError: (err) => Alert.alert('Erreur', err.message),
  });

  const [form, setForm] = useState({ dateDebut: '', dateFin: '', motif: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateDebut)) e.dateDebut = 'Format AAAA-MM-JJ requis';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateFin)) e.dateFin = 'Format AAAA-MM-JJ requis';
    if (form.dateFin < form.dateDebut) e.dateFin = 'La date de fin doit être ≥ la date de début';
    if (!form.motif.trim()) e.motif = 'Motif requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCreate() {
    if (!validate()) return;
    createMutation.mutate(form);
  }

  function handleDelete(id: number, motif: string) {
    showConfirm(
      'Supprimer la fermeture',
      `Supprimer "${motif}" ?`,
      () => deleteMutation.mutate({ id }),
      'Supprimer',
      true,
    );
  }

  // Trier par date de début
  const sorted = [...fermetures].sort((a: any, b: any) => a.dateDebut.localeCompare(b.dateDebut));
  // Séparer passées et à venir
  const today = new Date().toISOString().slice(0, 10);
  const avenir = sorted.filter((f: any) => f.dateFin >= today);
  const passees = sorted.filter((f: any) => f.dateFin < today);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Retour</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Congés & Fermetures</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Formulaire d'ajout */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ajouter une fermeture</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.muted }]}>Date de début</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: errors.dateDebut ? colors.error : colors.border, color: colors.foreground }]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.muted}
                value={form.dateDebut}
                onChangeText={(v) => setForm(f => ({ ...f, dateDebut: v }))}
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.dateDebut ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.dateDebut}</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.muted }]}>Date de fin</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: errors.dateFin ? colors.error : colors.border, color: colors.foreground }]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.muted}
                value={form.dateFin}
                onChangeText={(v) => setForm(f => ({ ...f, dateFin: v }))}
                keyboardType="numeric"
                maxLength={10}
              />
              {errors.dateFin ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.dateFin}</Text> : null}
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.muted }]}>Motif</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: errors.motif ? colors.error : colors.border, color: colors.foreground }]}
              placeholder="Ex: Congés d'été, Jour férié, Maintenance..."
              placeholderTextColor={colors.muted}
              value={form.motif}
              onChangeText={(v) => setForm(f => ({ ...f, motif: v }))}
              returnKeyType="done"
            />
            {errors.motif ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.motif}</Text> : null}
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={createMutation.isPending}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          >
            {createMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.addBtnText}>+ Ajouter la fermeture</Text>
            }
          </Pressable>
        </View>

        {/* Fermetures à venir */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          À venir ({avenir.length})
        </Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : avenir.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucune fermeture planifiée</Text>
          </View>
        ) : (
          avenir.map((f: any) => (
            <FermetureRow
              key={f.id}
              fermeture={f}
              colors={colors}
              onDelete={() => handleDelete(f.id, f.motif)}
              isDeleting={deleteMutation.isPending}
              isUpcoming
            />
          ))
        )}

        {/* Fermetures passées */}
        {passees.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: 8 }]}>
              Historique ({passees.length})
            </Text>
            {passees.map((f: any) => (
              <FermetureRow
                key={f.id}
                fermeture={f}
                colors={colors}
                onDelete={() => handleDelete(f.id, f.motif)}
                isDeleting={deleteMutation.isPending}
                isUpcoming={false}
              />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function FermetureRow({ fermeture, colors, onDelete, isDeleting, isUpcoming }: any) {
  const isSingle = isSameDay(fermeture.dateDebut, fermeture.dateFin);
  const dateLabel = isSingle
    ? formatDate(fermeture.dateDebut)
    : `${formatDate(fermeture.dateDebut)} → ${formatDate(fermeture.dateFin)}`;

  return (
    <View style={[styles.fermetureRow, {
      backgroundColor: isUpcoming ? colors.surface : colors.background,
      borderColor: isUpcoming ? '#F59E0B' : colors.border,
      borderLeftWidth: isUpcoming ? 4 : 1,
    }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.fermetureMotif, { color: colors.foreground }]}>{fermeture.motif}</Text>
        <Text style={[styles.fermetureDate, { color: isUpcoming ? '#F59E0B' : colors.muted }]}>
          {isUpcoming ? '📅 ' : '🗓 '}{dateLabel}
        </Text>
      </View>
      <Pressable
        onPress={onDelete}
        disabled={isDeleting}
        style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn: { width: 60 },
  backText: { fontSize: 17, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  scroll: { padding: 16, gap: 12 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  errorText: { fontSize: 11, marginTop: 3 },
  addBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  emptyBox: { borderRadius: 12, padding: 16, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  fermetureRow: { borderRadius: 12, padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fermetureMotif: { fontSize: 15, fontWeight: '600' },
  fermetureDate: { fontSize: 13, marginTop: 3 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EF444415', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
});
