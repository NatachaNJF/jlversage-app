import * as Linking from "expo-linking";
import * as ReactNative from "react-native";
import * as WebBrowser from "expo-web-browser";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "space.manus.versage.terres.t20260224100306";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  // On web: check if we're on Railway (production) or dev sandbox
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;

    // Dev sandbox: Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }

    // Production Railway / Manus: API and web are on the same domain/port
    // Use relative URL (empty string) so tRPC calls go to the same origin
    if (hostname.includes("railway.app") || hostname.includes("up.railway.app") || hostname.includes("manus.space") || hostname.includes("manus.computer")) {
      return "";
    }

    // Other production: use current origin
    return `${protocol}//${hostname}${port ? ":" + port : ""}`;
  }

  // Fallback for native apps: use production URL
  return "https://backend-production-1c955.up.railway.app";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint
 * - Native: uses deep link scheme (manus* scheme, not exp://)
 */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  } else {
    // Always use the manus* scheme (not exp://) to comply with OAuth requirements
    return Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
  }
};

/**
 * Get the redirect URI for WebBrowser auth session.
 * Uses the HTTPS API callback which then redirects back via deep link.
 * This avoids the exp:// scheme issue in Expo Go.
 */
export const getWebBrowserRedirectUri = () => {
  // Always use the HTTPS API callback endpoint
  // The server will redirect back to the app via the manus* deep link
  const apiBase = getApiBaseUrl();
  if (apiBase) {
    return `${apiBase}/api/oauth/callback`;
  }
  // Fallback: derive from current URL on web
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    return `${protocol}//${apiHostname}/api/oauth/callback`;
  }
  return `${getApiBaseUrl()}/api/oauth/callback`;
};

export const getLoginUrl = () => {
  const redirectUri = getRedirectUri();
  const state = encodeState(redirectUri);

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Start OAuth login flow.
 *
 * On native platforms (iOS/Android), use WebBrowser.openAuthSessionAsync
 * which handles the OAuth flow in an in-app browser and captures the callback
 * correctly — even in Expo Go (avoids the exp:// scheme restriction).
 *
 * On web, this simply redirects to the login URL.
 *
 * @returns The redirect URL if captured by WebBrowser, or null.
 */
export async function startOAuthLogin(): Promise<string | null> {
  if (ReactNative.Platform.OS === "web") {
    // On web, just redirect
    const loginUrl = getLoginUrl();
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    return null;
  }

  // On native: use WebBrowser.openAuthSessionAsync with the HTTPS callback
  // This avoids the exp:// scheme restriction in Expo Go
  const webBrowserRedirectUri = getWebBrowserRedirectUri();
  const state = encodeState(webBrowserRedirectUri);

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", webBrowserRedirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  const loginUrl = url.toString();
  console.log("[OAuth] Opening auth session with WebBrowser:", loginUrl);
  console.log("[OAuth] WebBrowser redirect URI:", webBrowserRedirectUri);

  try {
    // The deep link scheme used as the redirect for WebBrowser
    const deepLinkRedirect = Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
    console.log("[OAuth] Deep link redirect:", deepLinkRedirect);

    const result = await WebBrowser.openAuthSessionAsync(loginUrl, deepLinkRedirect);
    console.log("[OAuth] WebBrowser result:", result);

    if (result.type === "success" && result.url) {
      return result.url;
    }
    return null;
  } catch (error) {
    console.error("[OAuth] WebBrowser.openAuthSessionAsync failed:", error);
    // Fallback: try opening URL directly
    try {
      await Linking.openURL(loginUrl);
    } catch (fallbackError) {
      console.error("[OAuth] Fallback Linking.openURL also failed:", fallbackError);
    }
    return null;
  }
}
