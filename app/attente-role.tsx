import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';

export default function AttenteRoleScreen() {
  const colors = useColors();
  const { user, logout, refresh, loading } = useAuthContext();

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        {/* Icône */}
        <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Accès en attente
        </Text>

        {/* Sous-titre */}
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Votre compte est bien créé, mais un rôle doit vous être attribué par le gestionnaire avant de pouvoir accéder à l'application.
        </Text>

        {/* Infos utilisateur */}
        {user && (
          <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.userCardTitle, { color: colors.muted }]}>Connecté en tant que</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {(user as any).name || 'Utilisateur'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>
              {(user as any).email || ''}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>Que faire ?</Text>
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Contactez le gestionnaire de JL Versage pour qu'il vous attribue le rôle approprié (Gestionnaire ou Préposé) depuis l'onglet "Utilisateurs" de l'application.
          </Text>
        </View>

        {/* Bouton rafraîchir */}
        <Pressable
          onPress={refresh}
          disabled={loading}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.refreshBtnText}>Vérifier mon accès</Text>
          )}
        </Pressable>

        {/* Bouton déconnexion */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.logoutBtnText, { color: colors.muted }]}>Se déconnecter</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  userCard: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
    alignItems: 'center',
  },
  userCardTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  infoBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoText: { fontSize: 14, lineHeight: 20 },
  refreshBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutBtn: { paddingVertical: 8 },
  logoutBtnText: { fontSize: 14 },
});
