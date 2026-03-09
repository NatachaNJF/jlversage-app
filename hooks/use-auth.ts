import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called");
    try {
      setLoading(true);
      setError(null);

      // Web platform: use token-based auth (same as native, stored in localStorage)
      if (Platform.OS === "web") {
        console.log("[useAuth] Web platform: checking localStorage token...");
        const sessionToken = await Auth.getSessionToken();
        if (!sessionToken) {
          console.log("[useAuth] Web: No token in localStorage");
          setUser(null);
          return;
        }
        // Use cached user info from localStorage
        const cachedUser = await Auth.getUserInfo();
        if (cachedUser) {
          console.log("[useAuth] Web: Using cached user info from localStorage");
          setUser(cachedUser);
        } else {
          // Token exists but no cached user - fetch from API
          console.log("[useAuth] Web: Token present but no cached user, fetching from API...");
          const apiUser = await Api.getMe();
          if (apiUser) {
            const userInfo: Auth.User = {
              id: apiUser.id,
              openId: apiUser.openId,
              name: apiUser.name,
              email: apiUser.email,
              loginMethod: apiUser.loginMethod,
              lastSignedIn: new Date(apiUser.lastSignedIn),
              role: (apiUser as any).role ?? null,
              appRole: (apiUser as any).appRole ?? null,
            };
            setUser(userInfo);
            await Auth.setUserInfo(userInfo);
          } else {
            setUser(null);
            await Auth.clearUserInfo();
            await Auth.removeSessionToken();
          }
        }
        return;
      }

      // Native platform: use token-based auth
      console.log("[useAuth] Native platform: checking for session token...");
      const sessionToken = await Auth.getSessionToken();
      console.log(
        "[useAuth] Session token:",
        sessionToken ? `present (${sessionToken.substring(0, 20)}...)` : "missing",
      );
      if (!sessionToken) {
        console.log("[useAuth] No session token, setting user to null");
        setUser(null);
        return;
      }

      // Use cached user info for native (token validates the session)
      const cachedUser = await Auth.getUserInfo();
      console.log("[useAuth] Cached user:", cachedUser);
      if (cachedUser) {
        console.log("[useAuth] Using cached user info");
        setUser(cachedUser);
      } else {
        console.log("[useAuth] No cached user, setting user to null");
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log("[useAuth] fetchUser completed, loading:", false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
      // Continue with logout even if API call fails
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    console.log("[useAuth] useEffect triggered, autoFetch:", autoFetch, "platform:", Platform.OS);
    if (autoFetch) {
      if (Platform.OS === "web") {
        // Web: check localStorage token first (same as native)
        console.log("[useAuth] Web: checking localStorage token...");
        Auth.getSessionToken().then((token) => {
          if (token) {
            // Token exists, check cached user
            Auth.getUserInfo().then((cachedUser) => {
              if (cachedUser) {
                console.log("[useAuth] Web: setting cached user immediately");
                setUser(cachedUser);
                setLoading(false);
              } else {
                fetchUser();
              }
            });
          } else {
            // No token, user is not authenticated
            console.log("[useAuth] Web: no token, user not authenticated");
            setUser(null);
            setLoading(false);
          }
        });
      } else {
        // Native: check for cached user info first for faster initial load
        Auth.getUserInfo().then((cachedUser) => {
          console.log("[useAuth] Native cached user check:", cachedUser);
          if (cachedUser) {
            console.log("[useAuth] Native: setting cached user immediately");
            setUser(cachedUser);
            setLoading(false);
          } else {
            // No cached user, check session token
            fetchUser();
          }
        });
      }
    } else {
      console.log("[useAuth] autoFetch disabled, setting loading to false");
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  useEffect(() => {
    console.log("[useAuth] State updated:", {
      hasUser: !!user,
      loading,
      isAuthenticated,
      error: error?.message,
    });
  }, [user, loading, isAuthenticated, error]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
  };
}
