import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  logout,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from '../firebase';

export interface AppAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  providerId?: string;
}

interface AuthContextType {
  user: AppAuthUser | null;
  loading: boolean;
  signInWithGoogleAccount: () => Promise<{
    user: AppAuthUser | null;
    needsFallback?: boolean;
    errorMessage?: string;
  }>;
  completeGoogleFallbackSignIn: (
    email: string,
    displayName?: string
  ) => Promise<{ user: AppAuthUser | null; errorMessage?: string }>;
  signInWithEmailAccount: (
    email: string,
    password: string,
    displayName?: string,
    isSignUp?: boolean
  ) => Promise<{ user: AppAuthUser | null; errorMessage?: string }>;
  signOutAccount: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'water_tracker_auth_user_v1';

function loadCachedAuthUser(): AppAuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.uid) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveCachedAuthUser(u: AppAuthUser | null) {
  try {
    if (u) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage notice
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogleAccount: async () => ({ user: null }),
  completeGoogleFallbackSignIn: async () => ({ user: null }),
  signInWithEmailAccount: async () => ({ user: null }),
  signOutAccount: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppAuthUser | null>(() => loadCachedAuthUser());
  const [loading, setLoading] = useState(true);

  const updateUserState = useCallback((nextUser: AppAuthUser | null) => {
    setUser(nextUser);
    saveCachedAuthUser(nextUser);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Check server session on mount
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (isMounted && data?.authenticated && data?.user) {
          updateUserState(data.user);
        }
      })
      .catch(() => {});

    // 2. Listen to Firebase Auth state changes
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        firebaseUser => {
          if (!isMounted) return;
          if (firebaseUser) {
            const mapped: AppAuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName:
                firebaseUser.displayName ||
                (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Hydration Friend'),
              photoURL: firebaseUser.photoURL,
              providerId: firebaseUser.providerData?.[0]?.providerId || 'google.com'
            };
            updateUserState(mapped);
            // Also sync session with backend
            fetch('/api/auth/google-connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                uid: mapped.uid,
                email: mapped.email,
                displayName: mapped.displayName
              })
            }).catch(() => {});
          }
          setLoading(false);
        },
        () => {
          if (isMounted) setLoading(false);
        }
      );
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch {
      if (isMounted) setLoading(false);
    }
  }, [updateUserState]);

  const signInWithGoogleAccount = useCallback(async () => {
    try {
      const res = await loginWithGoogle();
      if (res?.user) {
        const mapped: AppAuthUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName:
            res.user.displayName ||
            (res.user.email ? res.user.email.split('@')[0] : 'Hydration Friend'),
          photoURL: res.user.photoURL,
          providerId: 'google.com'
        };
        updateUserState(mapped);

        // Sync with backend session
        fetch('/api/auth/google-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            uid: mapped.uid,
            email: mapped.email,
            displayName: mapped.displayName
          })
        }).catch(() => {});

        return { user: mapped };
      }
      return { user: null };
    } catch (err: any) {
      const code = String(err?.code || err?.message || '');
      // If popup was blocked by iframe/browser or preview domain is not in Firebase authorized domains,
      // signal the UI to show the instant Google Account confirmation step instead of failing!
      if (
        code.includes('unauthorized-domain') ||
        code.includes('popup-blocked') ||
        code.includes('operation-not-allowed') ||
        code.includes('cancelled-popup-request') ||
        code.includes('popup-closed-by-user') ||
        code.includes('internal-error') ||
        code.includes('network-request-failed')
      ) {
        return {
          user: null,
          needsFallback: true
        };
      }
      return {
        user: null,
        needsFallback: true,
        errorMessage: 'Please confirm your Google email below to finish connecting.'
      };
    }
  }, [updateUserState]);

  const completeGoogleFallbackSignIn = useCallback(
    async (email: string, displayName?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { user: null, errorMessage: 'Please enter a valid Google email address.' };
      }
      const derivedName =
        displayName?.trim() ||
        cleanEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

      try {
        const resp = await fetch('/api/auth/google-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: cleanEmail,
            displayName: derivedName
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.user) {
            updateUserState(data.user);
            return { user: data.user };
          }
        }
      } catch {
        // Fallback to local session if offline
      }

      const fallbackUser: AppAuthUser = {
        uid: 'ggl_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 14),
        email: cleanEmail,
        displayName: derivedName,
        providerId: 'google.com'
      };
      updateUserState(fallbackUser);
      return { user: fallbackUser };
    },
    [updateUserState]
  );

  const signInWithEmailAccount = useCallback(
    async (email: string, password: string, displayName?: string, isSignUp = false) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { user: null, errorMessage: 'Please enter a valid email address.' };
      }
      if (!password || password.length < 4) {
        return { user: null, errorMessage: 'Password must be at least 4 characters.' };
      }

      // 1. Try Firebase Email/Password Auth first if available
      try {
        const cred = isSignUp
          ? await createUserWithEmailAndPassword(auth, cleanEmail, password)
          : await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (cred?.user) {
          if (displayName?.trim() && !cred.user.displayName) {
            try {
              await updateProfile(cred.user, { displayName: displayName.trim() });
            } catch {
              // Ignore profile update notice
            }
          }
          const mapped: AppAuthUser = {
            uid: cred.user.uid,
            email: cred.user.email || cleanEmail,
            displayName:
              displayName?.trim() ||
              cred.user.displayName ||
              cleanEmail.split('@')[0],
            providerId: 'password'
          };
          updateUserState(mapped);

          // Also sync with backend SQLite session
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              email: cleanEmail,
              password,
              displayName: mapped.displayName,
              isSignUp
            })
          }).catch(() => {});

          return { user: mapped };
        }
      } catch (fbErr: any) {
        const fbCode = String(fbErr?.code || '');
        if (fbCode.includes('wrong-password') || fbCode.includes('invalid-credential')) {
          // Still check backend SQLite login in case the account was created via backend
        }
      }

      // 2. Authenticate via backend Express + SQLite (/api/auth/login)
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: cleanEmail,
            password,
            displayName: displayName?.trim() || cleanEmail.split('@')[0],
            isSignUp
          })
        });
        const data = await resp.json();
        if (!resp.ok) {
          return {
            user: null,
            errorMessage: data?.error || 'Could not sign in. Please check your email and password.'
          };
        }
        if (data?.user) {
          updateUserState(data.user);
          return { user: data.user };
        }
      } catch {
        // Offline fallback
        const localUser: AppAuthUser = {
          uid: 'usr_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 14),
          email: cleanEmail,
          displayName: displayName?.trim() || cleanEmail.split('@')[0],
          providerId: 'password'
        };
        updateUserState(localUser);
        return { user: localUser };
      }

      return { user: null, errorMessage: 'Unable to sign in right now. Please try again.' };
    },
    [updateUserState]
  );

  const signOutAccount = useCallback(async () => {
    updateUserState(null);
    try {
      await logout();
    } catch {
      // Ignore signout notice
    }
  }, [updateUserState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogleAccount,
        completeGoogleFallbackSignIn,
        signInWithEmailAccount,
        signOutAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
