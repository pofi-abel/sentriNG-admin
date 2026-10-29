// src/lib/token-manager.ts - The admin's bearer token (1 h, admin-scoped). In memory, mirrored to sessionStorage so a
// refresh keeps this tab signed in. Never localStorage: it outlives the tab and any XSS could read it.

export interface Session {
  token: string;
  expiresAt: string;
  analystId: number;
}

const KEY = "sentring.admin.session";
let current: Session | null = null;

function read(): Session | null {
  if (current) return current;
  if (typeof window === "undefined") return null;
  try {
    current = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
  } catch {
    current = null;
  }
  return current;
}

export const tokenManager = {
  set(session: Session) {
    current = session;
    sessionStorage.setItem(KEY, JSON.stringify(session));
  },

  /** The session, or null when there is none or it has expired */
  get(): Session | null {
    const session = read();
    if (session && Date.parse(session.expiresAt) <= Date.now()) {
      tokenManager.clear();
      return null;
    }
    return session;
  },

  getToken: () => tokenManager.get()?.token ?? null,

  clear() {
    current = null;
    if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
  },
};
