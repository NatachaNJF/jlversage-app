import { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { startOAuthLogin } from '@/constants/oauth';
import * as Auth from '@/lib/_core/auth';
import * as Api from '@/lib/_core/api';
import { useColors } from '@/hooks/use-colors';

export default function LoginScreen() {
  const { isAuthenticated, loading, refresh } = useAuthContext();
  const colors = useColors();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      // startOAuthLogin retourne l'URL de callback sur mobile (WebBrowser),
      // ou null sur web (redirection directe)
      const callbackUrl = await startOAuthLogin();

      if (Platform.OS !== 'web' && callbackUrl) {
        // Sur mobile : traiter le callback URL retourné par WebBrowser
        console.log('[Login] Callback URL received from WebBrowser:', callbackUrl);

        // Parser les paramètres de l'URL de callback
        let code: string | null = null;
        let state: string | null = null;
        let sessionToken: string | null = null;

        try {
          const urlObj = new URL(callbackUrl);
          code = urlObj.searchParams.get('code');
          state = urlObj.searchParams.get('state');
          sessionToken = urlObj.searchParams.get('sessionToken');
          console.log('[Login] Parsed callback params:', { hasCode: !!code, hasState: !!state, hasSessionToken: !!sessionToken });
        } catch (e) {
          // Essayer avec regex si URL invalide
          const codeMatch = callbackUrl.match(/[?&]code=([^&]+)/);
          const stateMatch = callbackUrl.match(/[?&]state=([^&]+)/);
          const tokenMatch = callbackUrl.match(/[?&]sessionToken=([^&]+)/);
          if (codeMatch) code = decodeURIComponent(codeMatch[1]);
          if (stateMatch) state = decodeURIComponent(stateMatch[1]);
          if (tokenMatch) sessionToken = decodeURIComponent(tokenMatch[1]);
        }

        // Si on a un sessionToken directement dans l'URL
        if (sessionToken) {
          console.log('[Login] Session token found in callback URL');
          await Auth.setSessionToken(sessionToken);
          await refresh();
          return;
        }

        // Sinon, échanger le code contre un token
        if (code && state) {
          console.log('[Login] Exchanging code for session token...');
          const result = await Api.exchangeOAuthCode(code, state);
          if (result.sessionToken) {
            await Auth.setSessionToken(result.sessionToken);
            if (result.user) {
              const userInfo: Auth.User = {
                id: result.user.id,
                openId: result.user.openId,
                name: result.user.name,
                email: result.user.email,
                loginMethod: result.user.loginMethod,
                lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
                role: (result.user as any).role ?? null,
                appRole: (result.user as any).appRole ?? null,
              };
              await Auth.setUserInfo(userInfo);
            }
            await refresh();
          } else {
            setLoginError('Authentification échouée. Veuillez réessayer.');
          }
        } else {
          // L'utilisateur a peut-être annulé
          console.log('[Login] No code/state in callback URL, user may have cancelled');
        }
      }
      // Sur web : la redirection est gérée automatiquement
    } catch (err) {
      console.error('[Login] handleLogin error:', err);
      setLoginError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
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

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Accès sécurisé
          </Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            Connectez-vous pour accéder à l'application. Votre rôle (Gestionnaire ou Préposé) sera attribué par l'administrateur.
          </Text>
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
          disabled={isLoggingIn}
          style={({ pressed }) => [
            styles.loginButton,
            { backgroundColor: colors.primary, opacity: (pressed || isLoggingIn) ? 0.75 : 1 },
          ]}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </Pressable>

        {/* Info */}
        <Text style={[styles.infoText, { color: colors.muted }]}>
          Première connexion ? Contactez l'administrateur pour obtenir votre accès.
        </Text>
      </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 16 },
  header: { alignItems: 'center', gap: 8 },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: { width: 72, height: 72, borderRadius: 16 },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, textAlign: 'center' },
  siteName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: { borderRadius: 16, padding: 20, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardText: { fontSize: 14, lineHeight: 20 },
  errorCard: { borderRadius: 12, padding: 14, borderWidth: 1 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  loginButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  infoText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
