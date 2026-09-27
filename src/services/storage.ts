import { User, Demande, Session } from '../types';
import { SEED_USERS, SEED_DEMANDES, SEED_SESSIONS } from '../data/seed_data';

const DEFAULT_STARTUP_USER_ID = 'user_awa_3e';

const STORAGE_KEYS = {
  CURRENT_USER: '@linkup_current_user_v1',
  USERS: '@linkup_users_v1',
  DEMANDES: '@linkup_demandes_v1',
  SESSIONS: '@linkup_sessions_v1',
  ACTIVE_SESSION: '@linkup_active_session_v1',
  PENDING_RATING: '@linkup_pending_rating_v1',
};

const memoryStore: Record<string, string> = {};

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = canUseLocalStorage() ? window.localStorage.getItem(key) : memoryStore[key];
    if (raw !== null && raw !== undefined) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    if (memoryStore[key]) {
      return JSON.parse(memoryStore[key]) as T;
    }
  }
  return defaultValue;
}

async function setItem<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  memoryStore[key] = serialized;
  if (canUseLocalStorage()) {
    window.localStorage.setItem(key, serialized);
  }
}

export const StorageService = {
  async initStorage(): Promise<{
    currentUser: User | null;
    users: User[];
    demandes: Demande[];
    sessions: Session[];
    activeSession: Session | null;
    pendingRatingSession: Session | null;
  }> {
    let users = await getItem<User[]>(STORAGE_KEYS.USERS, []);
    let demandes = await getItem<Demande[]>(STORAGE_KEYS.DEMANDES, []);
    let sessions = await getItem<Session[]>(STORAGE_KEYS.SESSIONS, []);
    let currentUser = await getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    const activeSession = await getItem<Session | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
    const pendingRatingSession = await getItem<Session | null>(STORAGE_KEYS.PENDING_RATING, null);

    if (!users || users.length === 0) {
      users = [...SEED_USERS];
      await setItem(STORAGE_KEYS.USERS, users);
    }
    if (!demandes || demandes.length === 0) {
      demandes = [...SEED_DEMANDES];
      await setItem(STORAGE_KEYS.DEMANDES, demandes);
    }
    if (!sessions || sessions.length === 0) {
      sessions = [...SEED_SESSIONS];
      await setItem(STORAGE_KEYS.SESSIONS, sessions);
    }
    if (!currentUser && users.length > 0) {
      currentUser = users.find((user) => user.id === DEFAULT_STARTUP_USER_ID) ?? users[0];
      await setItem(STORAGE_KEYS.CURRENT_USER, currentUser);
    }

    return { currentUser, users, demandes, sessions, activeSession, pendingRatingSession };
  },

  async saveCurrentUser(user: User | null): Promise<void> {
    await setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  async saveUsers(users: User[]): Promise<void> {
    await setItem(STORAGE_KEYS.USERS, users);
  },

  async saveDemandes(demandes: Demande[]): Promise<void> {
    await setItem(STORAGE_KEYS.DEMANDES, demandes);
  },

  async saveSessions(sessions: Session[]): Promise<void> {
    await setItem(STORAGE_KEYS.SESSIONS, sessions);
  },

  async saveActiveSession(session: Session | null): Promise<void> {
    await setItem(STORAGE_KEYS.ACTIVE_SESSION, session);
  },

  async savePendingRatingSession(session: Session | null): Promise<void> {
    await setItem(STORAGE_KEYS.PENDING_RATING, session);
  },

  async resetAll(): Promise<void> {
    Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
    if (canUseLocalStorage()) {
      Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
    }
  },
};
