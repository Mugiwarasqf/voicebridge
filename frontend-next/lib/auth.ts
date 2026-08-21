import { type VBConfig } from "./config";

const TOKEN_KEY = "vb_id_token";

export interface JwtPayload {
  sub: string;
  email?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function getIdToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setIdToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearIdToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

export function decodeJwt(token: string): JwtPayload {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return { sub: "" };
  }
}

export function isTokenExpired(token: string): boolean {
  const { exp } = decodeJwt(token);
  if (!exp) return false;
  return Date.now() >= exp * 1000;
}

// ── URL builders ──────────────────────────────────────────────────────────────

function hostedUiBase(cfg: VBConfig): string {
  return `https://${cfg.cognitoDomain}.auth.${cfg.awsRegion}.amazoncognito.com`;
}

function redirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/app`;
}

export function buildLoginUrl(cfg: VBConfig): string {
  const params = new URLSearchParams({
    client_id: cfg.cognitoClientId,
    response_type: "token",
    scope: "openid email",
    redirect_uri: redirectUri(),
  });
  return `${hostedUiBase(cfg)}/login?${params}`;
}

export function buildSignupUrl(cfg: VBConfig): string {
  const params = new URLSearchParams({
    client_id: cfg.cognitoClientId,
    response_type: "token",
    scope: "openid email",
    redirect_uri: redirectUri(),
  });
  return `${hostedUiBase(cfg)}/signup?${params}`;
}

export function buildLogoutUrl(cfg: VBConfig): string {
  const logoutUri = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    client_id: cfg.cognitoClientId,
    logout_uri: logoutUri,
  });
  return `${hostedUiBase(cfg)}/logout?${params}`;
}

// ── Token capture from URL fragment (called on /app page mount) ───────────────

export function captureTokenFromHash(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.location.hash.includes("id_token")) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("id_token");
  if (token) {
    setIdToken(token);
    // Clean the fragment from the URL without reloading
    history.replaceState({}, document.title, window.location.pathname);
    return token;
  }
  return null;
}
