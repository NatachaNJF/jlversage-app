import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';
import { router } from 'expo-router';

const ROLE_LABELS: Record<string, string> = {
  gestionnaire: '👔 Gestionnaire',
  prepose: '🦺 Préposé',
};

const ROLE_COLORS: Record<string, string> = {
  gestionnaire: '#3B82F6',
  prepose: '#10B981',
};

export default function UtilisateursScreen() {
  const colors = useColors();
  const { isAdmin, isGestionnaire } = useAuthContext();

  const usersQuery = trpc.users.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
    },
    onError: (err) => {
      Alert.alert('Erreur', err.message || 'Impossible de modifier le rôle.');
    },
  });

  // Rediriger si pas admin
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

  if (!isAdmin) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Utilisateurs</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.noAccessText, { color: colors.muted }]}>
            🔒 La gestion des rôles est réservée à l'administrateur.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  function handleChangeRole(userId: number, userName: string | null, currentRole: string | null) {
    const newRole = currentRole === 'gestionnaire' ? 'prepose' : 'gestionnaire';
    Alert.alert(
      'Modifier le rôle',
      `Attribuer le rôle "${newRole === 'gestionnaire' ? 'Gestionnaire' : 'Préposé'}" à ${userName || 'cet utilisateur'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => updateRoleMutation.mutate({ userId, appRole: newRole as 'gestionnaire' | 'prepose' }),
        },
      ]
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Gestion des utilisateurs</Text>
      </View>

      {/* Info admin */}
      <View style={[styles.infoBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}>
        <Text style={[styles.infoBannerText, { color: colors.primary }]}>
          🔑 En tant qu'administrateur, vous pouvez attribuer ou modifier le rôle de chaque utilisateur. Les rôles sont appliqués côté serveur.
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

                  {/* Rôle actuel */}
                  <View style={styles.roleRow}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor + '15', borderColor: roleColor + '40' }]}>
                      <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                        {appRole ? (ROLE_LABELS[appRole] || appRole) : '⚠️ Aucun rôle'}
                      </Text>
                    </View>

                    {/* Bouton changer rôle (sauf pour l'admin) */}
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
                  </View>

                  {/* Login method */}
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
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  infoBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  infoBannerText: { fontSize: 13, lineHeight: 18 },
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
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
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
});
