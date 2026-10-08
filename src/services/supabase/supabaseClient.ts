import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StudySession, StudyNote, AuthUser } from '../../types/index';

// Supabase project credentials provided for StudyMind
export const SUPABASE_PROJECT_ID = 'uxjlcvmgdnrvbwiczvgx';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  '';

export const SUPABASE_URL = (rawUrl && rawUrl.startsWith('http')) 
  ? rawUrl 
  : `https://${SUPABASE_PROJECT_ID}.supabase.co`;

const rawKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  '';

export const SUPABASE_ANON_KEY = rawKey || 'sb_publishable_-eASImoWnRYtsMmAfR1mzg_9KAkpemY';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Singleton Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseHealth {
  connected: boolean;
  projectId: string;
  url: string;
  latencyMs?: number;
  message?: string;
}

/**
 * Checks connectivity to the Supabase backend
 */
export async function testSupabaseConnection(): Promise<SupabaseHealth> {
  const startTime = Date.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latency = Date.now() - startTime;
    if (error) {
      return {
        connected: false,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        message: error.message,
      };
    }
    return {
      connected: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      latencyMs: latency,
      message: 'Supabase connected and authenticated',
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      message: err.message || 'Connection failed',
    };
  }
}

/**
 * Persists a study session to Supabase database.
 * Gracefully handles table absence or RLS restrictions.
 */
export async function syncSessionToSupabase(session: StudySession): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('study_sessions')
      .upsert({
        id: session.id,
        title: session.title,
        question: session.question,
        timestamp: session.timestamp,
        selected_models: session.selectedModels,
        session_data: session,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      // If table doesn't exist yet, log informative tip
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.info('Supabase table "study_sessions" does not exist yet. Run SQL setup to enable table persistence.');
      } else {
        console.warn('Supabase session sync notice:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync caught error:', err);
    return false;
  }
}

/**
 * Loads persisted study sessions from Supabase database
 */
export async function loadSessionsFromSupabase(): Promise<StudySession[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('session_data')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error || !data) {
      return null;
    }

    const sessions = data
      .map(row => row.session_data as StudySession)
      .filter(Boolean);

    return sessions.length > 0 ? sessions : null;
  } catch (err) {
    console.warn('Failed to load sessions from Supabase:', err);
    return null;
  }
}

/**
 * Persists study notes to Supabase
 */
export async function syncNoteToSupabase(sessionTitle: string, note: StudyNote): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('study_notes')
      .upsert({
        id: `note_${sessionTitle.slice(0, 30)}_${note.lastEdited}`,
        title: sessionTitle,
        note_data: note,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch {
    return false;
  }
}

const AUTH_USER_KEY = 'studymind_auth_user';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.warn('Failed to store auth user:', e);
  }
}

/**
 * Sign up a new user with Name, Email, and Password via Supabase Auth
 */
export async function signUpUser(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error?: string; message?: string }> {
  try {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data?.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        name: trimmedName || data.user.user_metadata?.name || trimmedEmail.split('@')[0],
        email: data.user.email || trimmedEmail,
        isGuest: false,
        createdAt: data.user.created_at,
      };

      // If user has a session, store it
      if (data.session) {
        storeUser(authUser);
        return { user: authUser };
      } else {
        // Confirmation email required by Supabase project config, or session pending
        storeUser(authUser);
        return { 
          user: authUser, 
          message: 'Account created! Welcome to StudyMind.' 
        };
      }
    }

    return { user: null, error: 'Sign up could not be completed.' };
  } catch (err: any) {
    return { user: null, error: err.message || 'An unexpected error occurred during sign up.' };
  }
}

/**
 * Log in an existing user with Email and Password via Supabase Auth
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const trimmedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data?.user) {
      const name = 
        data.user.user_metadata?.name || 
        data.user.user_metadata?.full_name || 
        trimmedEmail.split('@')[0];

      const authUser: AuthUser = {
        id: data.user.id,
        name,
        email: data.user.email || trimmedEmail,
        isGuest: false,
        createdAt: data.user.created_at,
      };

      storeUser(authUser);
      return { user: authUser };
    }

    return { user: null, error: 'Sign in could not be completed.' };
  } catch (err: any) {
    return { user: null, error: err.message || 'An unexpected error occurred during sign in.' };
  }
}

/**
 * Log out user from Supabase and clear local session
 */
export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase sign out notice:', e);
  } finally {
    storeUser(null);
  }
}

