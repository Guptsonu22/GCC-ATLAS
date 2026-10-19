import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
});

/**
 * Anonymous session identity: a uuid persisted to localStorage and sent as
 * X-Session-Key on saved-record calls. Saved comparisons / research are
 * scoped to this key server-side, so they are never exposed across browsers.
 */
const SESSION_STORAGE_KEY = 'gcc-atlas-session-key';

function getCachedSessionKey(): string | null {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function createSessionKey(): string {
  // A random string in the 8-64 [A-Za-z0-9_-] charset the API accepts.
  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
  } catch {
    // Private-mode/incognito: fall back to per-page-load identity.
  }
  return generated;
}

export function ensureSessionKey(): string {
  return getCachedSessionKey() ?? createSessionKey();
}

api.interceptors.request.use((config) => {
  config.headers['X-Session-Key'] = ensureSessionKey();
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.error?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out' : error.message || 'Network error');
    return Promise.reject(new Error(message));
  },
);
