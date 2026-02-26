import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl, TextInput, Modal, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
  gestionnaire: '👔 Gestionnaire',
  prepose: '🦺 Préposé',
};

const ROLE_COLORS: Record<string, string> = {
  gestionnaire: '#3B82F6',
  prepose: '#10B981',
};

type AppRole = 'gestionnaire' | 'prepose';

// Confirmation cross-platform (web + mobile)
function useConfirm() {
  const [state, setState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    destructive?: boolean;
  }>({ visible: false, title: '', message: '', onConfirm: () => {} });

  const confirm = (title: string, message: string, onConfirm: () => void, opts?: { confirmLabel?: string; destructive?: boolean }) => {
    if (Platform.OS === 'web') {
      // Sur web, utiliser window.confirm natif du navigateur
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      setState({ visible: true, title, message, onConfirm, ...opts });
    }
  };

  const dismiss = () => setState(s => ({ ...s, visible: false }));
  const handleConfirm = () => { state.onConfirm(); dismiss(); };

  return { confirm, confirmState: state, dismiss, handleConfirm };
}

export default function UtilisateursScreen() {
  const colors = useColors();
  const { isAdmin, isGestionnaire } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('prepose');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { confirm, confirmState, dismiss, handleConfirm } = useConfirm();

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: isAdmin || isGestionnaire,
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { usersQuery.refetch(); },
    onError: (err) => { setSuccessMsg(null); setFormError(err.message || 'Impossible de modifier le rôle.'); },
  });

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      setShowForm(false);
      setNewNom(''); setNewEmail(''); setNewRole('prepose'); setFormError(null);
      setSuccessMsg('Utilisateur créé et email d\'invitation envoyé.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err) => { setFormError(err.message); },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      setSuccessMsg('Utilisateur supprimé.');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err) => { setFormError(err.message || 'Impossible de supprimer l\'utilisateur.'); setTimeout(() => setFormError(null), 4000); },
  });

  const handleCreate = () => {
    setFormError(null);
    if (!newNom.trim()) { setFormError('Le nom est requis.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) { setFormError('Email invalide.'); return; }
    createUserMutation.mutate({ name: newNom.trim(), email: newEmail.trim(), appRole: newRole });
  };

  const handleDeleteUser = (userId: number, userName: string | null) => {
    confirm(
      'Supprimer l\'utilisateur',
      `Supprimer ${userName ?? 'cet utilisateur'} ? Cette action est irréversible.`,
      () => deleteUserMutation.mutate({ userId }),
      { confirmLabel: 'Supprimer', destructive: true }
    );
  };

  function handleChangeRole(userId: number, userName: string | null, currentRole: string | null) {
    const nextRole = currentRole === 'gestionnaire' ? 'prepose' : 'gestionnaire';
    confirm(
      'Modifier le rôle',
      `Attribuer le rôle "${nextRole === 'gestionnaire' ? 'Gestionnaire' : 'Préposé'}" à ${userName || 'cet utilisateur'} ?`,
      () => updateRoleMutation.mutate({ userId, appRole: nextRole as AppRole }),
      { confirmLabel: 'Confirmer' }
    );
  }

  // Rediriger si pas gestionnaire ni admin
  if (!isAdmin && !isGestionnaire) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={[styles.noAccessText, { color: colors.muted }]}>
            Accès réservé à l'administrateur.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <ScreenContainer>
      {/* Modal de confirmation (mobile uniquement — web utilise window.confirm) */}
      <Modal visible={confirmState.visible} transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{confirmState.title}</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>{confirmState.message}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={dismiss}
              >
                <Text style={[styles.modalBtnText, { color: colors.muted }]}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: confirmState.destructive ? colors.error : colors.primary, borderColor: 'transparent' }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{confirmState.confirmLabel || 'Confirmer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Gestion des utilisateurs</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { setShowForm(!showForm); setFormError(null); }}
        >
          <Text style={styles.addBtnText}>{showForm ? 'Annuler' : '+ Ajouter'}</Text>
        </Pressable>
      </View>

      {/* Messages de succès/erreur globaux */}
      {successMsg && (
        <View style={[styles.successBanner, { backgroundColor: colors.success + '18', borderColor: colors.success }]}>
          <Text style={[styles.successBannerText, { color: colors.success }]}>✓ {successMsg}</Text>
        </View>
      )}
      {formError && !showForm && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error }]}>
          <Text style={[styles.errorBannerText, { color: colors.error }]}>⚠ {formError}</Text>
        </View>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Nouvel utilisateur</Text>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Nom complet *</Text>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={newNom}
            onChangeText={setNewNom}
            placeholder="Jean Dupont"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Email *</Text>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="jean.dupont@exemple.be"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Rôle *</Text>
          <View style={styles.rolePickerRow}>
            {(['gestionnaire', 'prepose'] as AppRole[]).map((r) => (
              <Pressable
                key={r}
                style={[styles.roleChip, { backgroundColor: newRole === r ? ROLE_COLORS[r] : 'transparent', borderColor: ROLE_COLORS[r] }]}
                onPress={() => setNewRole(r)}
              >
                <Text style={{ color: newRole === r ? '#fff' : ROLE_COLORS[r], fontWeight: '700', fontSize: 13 }}>
                  {r === 'gestionnaire' ? 'Gestionnaire' : 'Préposé'}
                </Text>
              </Pressable>
            ))}
          </View>

          {formError && <Text style={{ color: colors.error, fontSize: 13, marginTop: 6 }}>{formError}</Text>}

          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.primary, opacity: createUserMutation.isPending ? 0.6 : 1 }]}
            onPress={handleCreate}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.createBtnText}>Créer et envoyer l'invitation</Text>
            }
          </Pressable>

          <Text style={[styles.formHint, { color: colors.muted }]}>
            Un email d'invitation sera envoyé automatiquement. L'utilisateur devra se connecter avec ce compte email via Manus.
          </Text>
        </View>
      )}

      {/* Info admin */}
      <View style={[styles.infoBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}>
        <Text style={[styles.infoBannerText, { color: colors.primary }]}>
          Attribuez un rôle à chaque utilisateur. Les permissions sont appliquées côté serveur.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={usersQuery.isLoading}
            onRefresh={() => usersQuery.refetch()}
          />
        }
      >
        {usersQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement des utilisateurs...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucun utilisateur trouvé</Text>
            <Text style={[styles.emptySubText, { color: colors.muted }]}>
              Les utilisateurs apparaissent ici après leur première connexion.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>
              {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
            </Text>

            {users.map((user: any) => {
              const appRole = user.appRole as string | null;
              const sysRole = user.role as string;
              const isUserAdmin = sysRole === 'admin';
              const roleColor = appRole ? (ROLE_COLORS[appRole] || '#6B7280') : '#6B7280';
              const lastSeen = user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString('fr-BE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              }) : '—';

              return (
                <View
                  key={user.id}
                  style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {/* Avatar + infos */}
                  <View style={styles.userRow}>
                    <View style={[styles.avatar, { backgroundColor: roleColor + '20' }]}>
                      <Text style={[styles.avatarText, { color: roleColor }]}>
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                          {user.name || 'Utilisateur inconnu'}
                        </Text>
                        {isUserAdmin && (
                          <View style={[styles.adminBadge, { backgroundColor: '#F59E0B20' }]}>
                            <Text style={[styles.adminBadgeText, { color: '#F59E0B' }]}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.userEmail, { color: colors.muted }]} numberOfLines={1}>
                        {user.email || 'Email non renseigné'}
                      </Text>
                      <Text style={[styles.userLastSeen, { color: colors.muted }]}>
                        Dernière connexion : {lastSeen}
                      </Text>
                    </View>
                  </View>

                  {/* Rôle + boutons */}
                  <View style={styles.roleRow}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor + '15', borderColor: roleColor + '40' }]}>
                      <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                        {appRole ? (ROLE_LABELS[appRole] || appRole) : '⚠️ Aucun rôle'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {!isUserAdmin && (
                        <Pressable
                          onPress={() => handleChangeRole(user.id, user.name, appRole)}
                          disabled={updateRoleMutation.isPending}
                          style={({ pressed }) => [
                            styles.changeRoleBtn,
                            { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 }
                          ]}
                        >
                          {updateRoleMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text style={[styles.changeRoleBtnText, { color: colors.primary }]}>
                              → {appRole === 'gestionnaire' ? 'Préposé' : 'Gestionnaire'}
                            </Text>
                          )}
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleDeleteUser(user.id, user.name)}
                        disabled={deleteUserMutation.isPending}
                        style={({ pressed }) => [
                          styles.changeRoleBtn,
                          { borderColor: colors.error, opacity: pressed ? 0.7 : 1 }
                        ]}
                      >
                        {deleteUserMutation.isPending
                          ? <ActivityIndicator size="small" color={colors.error} />
                          : <Text style={[styles.changeRoleBtnText, { color: colors.error }]}>Supprimer</Text>
                        }
                      </Pressable>
                    </View>
                  </View>

                  {user.loginMethod && (
                    <Text style={[styles.loginMethod, { color: colors.muted }]}>
                      Connexion via : {user.loginMethod}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Légende des rôles */}
        <View style={[styles.legendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.legendTitle, { color: colors.foreground }]}>Rôles disponibles</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendRoleName, { color: colors.foreground }]}>Gestionnaire</Text>
              <Text style={[styles.legendRoleDesc, { color: colors.muted }]}>
                Accès complet : chantiers, validation, offres, facturation, incidents
              </Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <View style={styles.legendText}>
              <Text style={[styles.legendRoleName, { color: colors.foreground }]}>Préposé</Text>
              <Text style={[styles.legendRoleDesc, { color: colors.muted }]}>
                Accès limité : enregistrement camions, registre du jour, incidents
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  formCard: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  textInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  rolePickerRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleChip: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 2, alignItems: 'center' },
  createBtn: { marginTop: 14, padding: 14, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  formHint: { fontSize: 11, marginTop: 10, lineHeight: 16 },
  infoBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  infoBannerText: { fontSize: 13, lineHeight: 18 },
  successBanner: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, padding: 12, borderWidth: 1 },
  successBannerText: { fontSize: 14, fontWeight: '600' },
  errorBanner: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, padding: 12, borderWidth: 1 },
  errorBannerText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  noAccessText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  userCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  userInfo: { flex: 1, gap: 3 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 15, fontWeight: '700', flex: 1 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText: { fontSize: 11, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  userLastSeen: { fontSize: 12 },
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  roleBadgeText: { fontSize: 13, fontWeight: '600' },
  changeRoleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  changeRoleBtnText: { fontSize: 13, fontWeight: '600' },
  loginMethod: { fontSize: 12 },
  legendCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  legendTitle: { fontSize: 14, fontWeight: '700' },
  legendRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  legendText: { flex: 1, gap: 2 },
  legendRoleName: { fontSize: 14, fontWeight: '600' },
  legendRoleDesc: { fontSize: 13, lineHeight: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalMessage: { fontSize: 14, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
