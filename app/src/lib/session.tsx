import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getItem, setItem } from './storage';
import { api, loadToken, saveToken, setUnauthorizedHandler } from './api';
import type { Patient, User } from './types';

const ACTIVE_KEY = 'bap.activePatient';

type Session = {
  ready: boolean;
  signedIn: boolean;
  user: User | null;
  patients: Patient[];
  active: Patient | null;
  signIn: (token: string, user: User, patients: Patient[]) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  choose: (patientId: string) => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const reset = useCallback(async () => {
    await saveToken(null);
    setSignedIn(false);
    setUser(null);
    setPatients([]);
  }, []);

  const refresh = useCallback(async () => {
    const me = await api<{ user: User; patients: Patient[] }>('/v1/auth/me');
    setUser(me.user);
    setPatients(me.patients);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void reset();
    });
    (async () => {
      const token = await loadToken();
      const stored = await getItem(ACTIVE_KEY);
      if (stored) setActiveId(stored);
      if (token) {
        try {
          await refresh();
          setSignedIn(true);
        } catch {
          setSignedIn(false);
        }
      }
      setReady(true);
    })();
  }, [refresh, reset]);

  const signIn = useCallback(async (token: string, nextUser: User, nextPatients: Patient[]) => {
    await saveToken(token);
    setUser(nextUser);
    setPatients(nextPatients);
    setSignedIn(true);
  }, []);

  const choose = useCallback(async (patientId: string) => {
    setActiveId(patientId);
    await setItem(ACTIVE_KEY, patientId);
  }, []);

  const active = useMemo(() => patients.find((p) => p.id === activeId) ?? patients[0] ?? null, [patients, activeId]);

  const value = useMemo<Session>(
    () => ({
      ready,
      signedIn,
      user,
      patients,
      active,
      signIn,
      signOut: async () => {
        try {
          await api('/v1/auth/logout', { method: 'POST' });
        } catch {}
        await reset();
      },
      refresh,
      choose,
    }),
    [ready, signedIn, user, patients, active, signIn, reset, refresh, choose],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession outside SessionProvider');
  return value;
}

export function usePatient(): Patient {
  const { active } = useSession();
  if (!active) throw new Error('No active patient');
  return active;
}
