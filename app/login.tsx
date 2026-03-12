import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { trpc } from '@/lib/trpc';
import { useColors } from '@/hooks/use-colors';
import * as Auth from '@/lib/_core/auth';

export default function LoginScreen() {
  const { isAuthenticated, loading, refresh } = useAuthContext();
  const colors = useColors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      // Stocker le token et les infos utilisateur (web + natif)
      if (data.token) {
        await Auth.setSessionToken(data.token);
        if (data.user) {
          await Auth.setUserInfo({
            id: data.user.id,
            openId: data.user.openId,
            name: data.user.name,
            email: data.user.email,
            loginMethod: data.user.loginMethod,
            lastSignedIn: new Date(data.user.lastSignedIn ?? Date.now()),
            role: data.user.role,
            appRole: data.user.appRole,
          });
        }
      }
      if (data.mustChangePassword) {
        setShowChangePassword(true);
      } else {
        await refresh();
      }
    },
    onError: (err) => {
      setLoginError(err.message || 'Email ou mot de passe incorrect.');
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: async () => {
      await refresh();
    },
    onError: (err) => {
      setChangeError(err.message || 'Impossible de changer le mot de passe.');
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading]);

  const handleLogin = () => {
    setLoginError(null);
    if (!email.trim()) { setLoginError('L\'email est requis.'); return; }
    if (!password) { setLoginError('Le mot de passe est requis.'); return; }
    loginMutation.mutate({ email: email.trim().toLowerCase(), password });
  };

  const handleChangePassword = () => {
    setChangeError(null);
    if (newPassword.length < 8) { setChangeError('Minimum 8 caractères.'); return; }
    if (newPassword !== confirmPassword) { setChangeError('Les mots de passe ne correspondent pas.'); return; }
    changePasswordMutation.mutate({ currentPassword: password, newPassword });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Écran de changement de mot de passe obligatoire
  if (showChangePassword) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
                <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>JL Versage</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Changer votre mot de passe</Text>
              <Text style={[styles.cardText, { color: colors.muted }]}>
                Pour des raisons de sécurité, vous devez définir un nouveau mot de passe personnel avant de continuer.
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Nouveau mot de passe *</Text>
                <TextInput
                  ref={newPasswordRef}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 8 caractères"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => {}}
                />
              </View>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>Confirmer le mot de passe *</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Répétez le mot de passe"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleChangePassword}
                />
              </View>
            </View>

            {changeError && (
              <View style={[styles.errorCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{changeError}</Text>
              </View>
            )}

            <Pressable
              onPress={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: colors.primary, opacity: (pressed || changePasswordMutation.isPending) ? 0.75 : 1 },
              ]}
            >
              {changePasswordMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.loginButtonText}>Confirmer</Text>
              }
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // Écran de connexion principal
  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Logo & titre */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>JL Versage</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Suivi du versage des terres
            </Text>
            <Text style={[styles.siteName, { color: colors.primary }]}>
              Site de Transinne
            </Text>
          </View>

          {/* Formulaire */}
          <View style={{ gap: 12 }}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.be"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Mot de passe</Text>
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {/* Erreur */}
          {loginError && (
            <View style={[styles.errorCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{loginError}</Text>
            </View>
          )}

          {/* Bouton connexion */}
          <Pressable
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            style={({ pressed }) => [
              styles.loginButton,
              { backgroundColor: colors.primary, opacity: (pressed || loginMutation.isPending) ? 0.75 : 1 },
            ]}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </Pressable>

          {/* Info */}
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Première connexion ? Contactez l'administrateur :{' '}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:jlversage@jerouville.be')}>
            <Text style={[styles.infoText, { color: colors.primary, textDecorationLine: 'underline' }]}>
              jlversage@jerouville.be
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 24,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { alignItems: 'center', gap: 8 },
  logoContainer: { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logo: { width: 72, height: 72, borderRadius: 16 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  siteName: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardText: { fontSize: 14, lineHeight: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  errorCard: { borderRadius: 12, padding: 14, borderWidth: 1 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  loginButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  infoText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
