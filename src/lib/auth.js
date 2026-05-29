export const AUTH_TOKEN_KEY = "cricket_app_token";
export const AUTH_USER_KEY = "cricket_app_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

export function clearAuthSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
}
