import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';
import { showAlert, showConfirm } from '@/lib/alert';

type ModalMode = 'create' | 'edit';

export default function TransporteursScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: transporteurs = [], isLoading } = trpc.transporteurs.list.useQuery();

  const createMutation = trpc.transporteurs.create.useMutation({
    onSuccess: (data: any) => {
      utils.transporteurs.list.invalidate();
      setModalVisible(false);
      resetForm();
      if (data.mailEnvoye) {
        showAlert('Transporteur ajouté', 'Le transporteur a été enregistré et les conditions d\'accès au site lui ont été envoyées par email.');
      } else {
        showAlert('Transporteur ajouté', 'Le transporteur a été enregistré. Aucun email n\'a été envoyé (pas d\'adresse email renseignée).');
      }
    },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const updateMutation = trpc.transporteurs.update.useMutation({
    onSuccess: () => { utils.transporteurs.list.invalidate(); setModalVisible(false); resetForm(); },
    onError: (err: any) => showAlert('Erreur', err.message),
  });
  const deleteMutation = trpc.transporteurs.delete.useMutation({
    onSuccess: () => utils.transporteurs.list.invalidate(),
    onError: (err: any) => showAlert('Erreur', err.message),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editId, setEditId] = useState<number | null>(null);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setNom(''); setTelephone(''); setEmail(''); setErrors({}); setEditId(null);
  }

  function openCreate() {
    resetForm();
    setModalMode('create');
    setModalVisible(true);
  }

  function openEdit(t: any) {
    setNom(t.nom || '');
    setTelephone(t.telephone || '');
    setEmail(t.email || '');
    setEditId(t.id);
    setErrors({});
    setModalMode('edit');
    setModalVisible(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nom.trim()) e.nom = 'Nom requis';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Email invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = { nom: nom.trim(), telephone: telephone.trim() || undefined, email: email.trim() || undefined };
    if (modalMode === 'create') {
      createMutation.mutate(data);
    } else if (editId !== null) {
      updateMutation.mutate({ id: editId, ...data });
    }
  }

  function handleDelete(t: any) {
    showConfirm(
      'Supprimer le transporteur',
      `Voulez-vous supprimer "${t.nom}" de la liste ?`,
      () => deleteMutation.mutate({ id: t.id }),
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Transporteurs</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={openCreate}
        >
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : transporteurs.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🚛</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun transporteur enregistré</Text>
          <Text style={[styles.emptySubtext, { color: colors.muted }]}>
            Ajoutez vos transporteurs habituels pour les sélectionner rapidement lors des versages.
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={openCreate}
          >
            <Text style={styles.emptyBtnText}>Ajouter un transporteur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {transporteurs.map((t: any) => (
            <View key={t.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {t.nom.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardNom, { color: colors.foreground }]}>{t.nom}</Text>
                  {t.telephone ? <Text style={[styles.cardDetail, { color: colors.muted }]}>{t.telephone}</Text> : null}
                  {t.email ? <Text style={[styles.cardDetail, { color: colors.muted }]}>{t.email}</Text> : null}
                  <View style={styles.mailBadgeRow}>
                    {t.email ? (
                      t.mailConditionsEnvoye
                        ? <View style={styles.mailBadgeOk}><Text style={styles.mailBadgeOkText}>✓ Conditions envoyées</Text></View>
                        : <View style={styles.mailBadgePending}><Text style={styles.mailBadgePendingText}>⏳ Mail non envoyé</Text></View>
                    ) : (
                      <View style={styles.mailBadgeNo}><Text style={styles.mailBadgeNoText}>Pas d'email</Text></View>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEdit(t)} style={[styles.actionBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(t)} style={[styles.actionBtn, { borderColor: '#FCA5A5' }]}>
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Modal Ajouter / Modifier */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={[styles.modalCancel, { color: colors.muted }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {modalMode === 'create' ? 'Nouveau transporteur' : 'Modifier le transporteur'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isPending}>
              {isPending
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={[styles.modalSave, { color: colors.primary }]}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Nom du transporteur <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                value={nom}
                onChangeText={setNom}
                placeholder="Ex: Transports Dupont SPRL"
                placeholderTextColor={colors.muted}
                style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.nom ? '#EF4444' : colors.border, color: colors.foreground }]}
              />
              {errors.nom ? <Text style={styles.errorText}>{errors.nom}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Téléphone (optionnel)</Text>
              <TextInput
                value={telephone}
                onChangeText={setTelephone}
                placeholder="+32 478 12 34 56"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email (optionnel)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="contact@transporteur.be"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: errors.email ? '#EF4444' : colors.border, color: colors.foreground }]}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  cardInfo: { flex: 1, gap: 2 },
  cardNom: { fontSize: 15, fontWeight: '600' },
  cardDetail: { fontSize: 13 },
  cardActions: { gap: 6 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontWeight: '500' },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 16, fontWeight: '600' },
  modalContent: { padding: 20, gap: 4 },
  field: { gap: 6, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
  errorText: { fontSize: 12, color: '#EF4444' },
  mailBadgeRow: { marginTop: 4 },
  mailBadgeOk: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  mailBadgeOkText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
  mailBadgePending: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  mailBadgePendingText: { fontSize: 11, color: '#92400E', fontWeight: '500' },
  mailBadgeNo: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  mailBadgeNoText: { fontSize: 11, color: '#6B7280', fontWeight: '400' },
});
