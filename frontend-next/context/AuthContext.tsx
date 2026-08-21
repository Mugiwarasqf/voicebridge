"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getConfig } from "@/lib/config";
import {
  captureTokenFromHash,
  clearIdToken,
  decodeJwt,
  getIdToken,
  buildLoginUrl,
  buildLogoutUrl,
  buildSignupUrl,
  type JwtPayload,
} from "@/lib/auth";
import { ApiClient } from "@/lib/api";

interface AuthContextValue {
  token: string | null;
  payload: JwtPayload | null;
  email: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  api: ApiClient | null;
  login: () => void;
  logout: () => void;
  signup: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  payload: null,
  email: null,
  isLoading: true,
  isAuthenticated: false,
  api: null,
  login: () => {},
  logout: () => {},
  signup: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Capture token from URL fragment (Cognito redirect) or restore from sessionStorage
    const captured = captureTokenFromHash();
    const existing = getIdToken();
    const resolved = captured ?? existing;
    setToken(resolved);
    setIsLoading(false);
  }, []);

  const cfg = getConfig();
  const payload = token ? decodeJwt(token) : null;
  const email = payload?.email ?? null;
  const api = token
    ? new ApiClient(cfg.apiBaseUrl, getIdToken)
    : null;

  const login = () => { window.location.href = buildLoginUrl(cfg); };
  const logout = () => {
    clearIdToken();
    setToken(null);
    window.location.href = buildLogoutUrl(cfg);
  };
  const signup = () => { window.location.href = buildSignupUrl(cfg); };

  return (
    <AuthContext.Provider
      value={{
        token,
        payload,
        email,
        isLoading,
        isAuthenticated: !!token,
        api,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
