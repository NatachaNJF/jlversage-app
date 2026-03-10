import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { showAlert, showConfirm } from '@/lib/alert';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

export default function ParametresScreen() {
  const colors = useColors();
  const { user, logout, isGestionnaire, isPrepose, isAdmin } = useAuthContext();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: logout,
    onError: () => showAlert('Erreur', 'Impossible de se déconnecter.'),
  });

  const userAny = user as any;

  const router = useRouter();

  function handleLogout() {
    showConfirm('Déconnexion', 'Voulez-vous vous déconnecter ?', () => logoutMutation.mutate(), 'Déconnecter', true);
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profil utilisateur */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mon profil</Text>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name || 'Utilisateur'}</Text>
              <Text style={[styles.profileEmail, { color: colors.muted }]}>{user?.email || '-'}</Text>
              <View style={[styles.roleBadge, { backgroundColor: isGestionnaire ? '#3B82F620' : '#10B98120' }]}>
                <Text style={[styles.roleBadgeText, { color: isGestionnaire ? '#3B82F6' : '#10B981' }]}>
                  {isGestionnaire ? '👔 Gestionnaire' : isPrepose ? '🦺 Préposé' : '👤 ' + ((userAny?.appRole) || 'Aucun rôle')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Accès selon le rôle */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Accès autorisés</Text>
          {isGestionnaire ? (
            <>
              <PermRow icon="✅" label="Tableau de bord complet" />
              <PermRow icon="✅" label="Gestion des chantiers (création, validation, clôture)" />
              <PermRow icon="✅" label="Envoi des offres de prix" />
              <PermRow icon="✅" label="Validation administrative des dossiers" />
              <PermRow icon="✅" label="Suivi des tonnages et facturation" />
              <PermRow icon="✅" label="Gestion des incidents" />
              <PermRow icon="✅" label="Registre complet" />
            </>
          ) : isPrepose ? (
            <>
              <PermRow icon="✅" label="Enregistrement des arrivées camion" />
              <PermRow icon="✅" label="Contrôle administratif et visuel" />
              <PermRow icon="✅" label="Registre du jour" />
              <PermRow icon="✅" label="Signalement d'incidents" />
              <PermRow icon="❌" label="Création/modification de chantiers" />
              <PermRow icon="❌" label="Validation administrative" />
              <PermRow icon="❌" label="Facturation" />
            </>
          ) : (
            <Text style={[styles.noRoleText, { color: colors.muted }]}>
              Aucun rôle attribué. Contactez votre administrateur pour obtenir un accès.
            </Text>
          )}
        </View>

        {/* Gestion (gestionnaires uniquement) */}
        {isGestionnaire && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Gestion</Text>
            <Pressable
              onPress={() => router.push('/transporteur' as any)}
              style={({ pressed }) => [styles.menuRow, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: 20 }}>🚛</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Transporteurs</Text>
                <Text style={[styles.menuSub, { color: colors.muted }]}>Gérer la liste des transporteurs autorisés</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/fermetures' as any)}
              style={({ pressed }) => [styles.menuRow, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: 20 }}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Congés & Fermetures</Text>
                <Text style={[styles.menuSub, { color: colors.muted }]}>Planifier les jours de fermeture du site</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
            </Pressable>
            {isAdmin && (
              <Pressable
                onPress={() => router.push('/admin/utilisateurs' as any)}
                style={({ pressed }) => [styles.menuRow, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={{ fontSize: 20 }}>👥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>Utilisateurs</Text>
                  <Text style={[styles.menuSub, { color: colors.muted }]}>Gérer les accès et les rôles</Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Info rôle */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
          <Text style={[styles.infoText, { color: colors.primary }]}>
            ℹ️ Le rôle est attribué par l'administrateur. Vous ne pouvez pas le modifier vous-même.
          </Text>
        </View>

        {/* Déconnexion */}
        <Pressable
          onPress={handleLogout}
          disabled={logoutMutation.isPending}
          style={({ pressed }) => [styles.logoutBtn, { backgroundColor: '#EF444415', borderColor: '#EF4444', opacity: pressed ? 0.7 : 1 }]}
        >
          {logoutMutation.isPending
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Text style={styles.logoutBtnText}>Se déconnecter</Text>
          }
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function PermRow({ icon, label }: { icon: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.permRow}>
      <Text style={styles.permIcon}>{icon}</Text>
      <Text style={[styles.permLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 13, fontWeight: '600' },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  permIcon: { fontSize: 16, width: 24 },
  permLabel: { fontSize: 14, flex: 1 },
  noRoleText: { fontSize: 14, lineHeight: 20 },
  infoBox: { borderRadius: 12, padding: 12, borderWidth: 1 },
  infoText: { fontSize: 13, lineHeight: 18 },
  logoutBtn: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  logoutBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuSub: { fontSize: 12, marginTop: 1 },
});
