import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axiosInstance from "../lib/axios";

const AuthContext = createContext(null);

function normalizeTokenValue(tokenValue) {
  if (!tokenValue || typeof tokenValue !== "string") {
    return "";
  }

  const normalized = tokenValue.replace(/^Bearer\s+/i, "").trim();

  if (
    !normalized ||
    normalized.toLowerCase() === "undefined" ||
    normalized.toLowerCase() === "null"
  ) {
    return "";
  }

  return normalized;
}

function getAuthErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    normalizeTokenValue(localStorage.getItem("token") || ""),
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(normalizeTokenValue(localStorage.getItem("token") || "")),
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const persistToken = useCallback((nextToken) => {
    const normalizedToken = normalizeTokenValue(nextToken);

    if (normalizedToken) {
      localStorage.setItem("token", normalizedToken);
      setToken(normalizedToken);
      setIsAuthenticated(true);
      return;
    }

    localStorage.removeItem("token");
    setToken("");
    setIsAuthenticated(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // Ignore network/logout endpoint failures and always clear local auth state.
    } finally {
      persistToken("");
      setUser(null);
    }
  }, [persistToken]);

  const login = useCallback(
    async (credentials) => {
      try {
        const response = await axiosInstance.post("/auth/login", credentials);
        const payload = response?.data?.data || response?.data || {};
        const nextToken = payload.token || payload.accessToken || "";

        if (!nextToken) {
          throw new Error("Login succeeded but no token was returned.");
        }

        persistToken(nextToken);

        const currentUser = payload.user || null;
        if (currentUser) {
          setUser(currentUser);
          return currentUser;
        }

        const meResponse = await axiosInstance.get("/auth/me");
        const me = meResponse?.data?.data || meResponse?.data?.user || null;
        setUser(me);

        return me;
      } catch (error) {
        throw new Error(
          getAuthErrorMessage(error, "Unable to login. Please try again."),
        );
      }
    },
    [persistToken],
  );

  const register = useCallback(
    async (payload) => {
      try {
        const response = await axiosInstance.post("/auth/register", payload);
        const data = response?.data?.data || response?.data || {};

        // Some backends return token on register; support both token and non-token responses.
        const nextToken = data.token || data.accessToken || "";
        const registeredUser = data.user || null;

        if (nextToken) {
          persistToken(nextToken);
          setUser(registeredUser);
          return registeredUser;
        }

        return data;
      } catch (error) {
        throw new Error(
          getAuthErrorMessage(error, "Unable to register. Please try again."),
        );
      }
    },
    [persistToken],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const response = await axiosInstance.get("/auth/me");
        const me = response?.data?.data || response?.data?.user || null;

        if (isMounted) {
          setUser(me);
          setIsAuthenticated(Boolean(me));
        }
      } catch (error) {
        if (isMounted) {
          const statusCode = Number(error?.response?.status || 0);

          if (statusCode === 401 || statusCode === 403) {
            persistToken("");
            setUser(null);
          } else {
            // Keep local session when backend/network is temporarily unavailable.
            setIsAuthenticated(Boolean(token));
          }
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [persistToken, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isAuthLoading,
      login,
      register,
      logout,
    }),
    [isAuthLoading, isAuthenticated, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
