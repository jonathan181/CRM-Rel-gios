'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { safeFetchJson } from '@/lib/api';
import { auth, googleAuthProvider } from '@/lib/firebase';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<AppUser | null>;
  signInWithEmail: (email: string, password: string) => Promise<AppUser | null>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<AppUser | null>;
  signInAsDemo: () => Promise<AppUser>;
  signOutUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => null,
  signInWithEmail: async () => null,
  signUpWithEmail: async () => null,
  signInAsDemo: async () => ({ uid: 'demo_user', email: 'demo@horological.com', displayName: 'Investidor Demo' }),
  signOutUser: async () => {},
  getToken: async () => null,
});

const AUTH_STORAGE_KEY = 'horological_app_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = false;

    // Safety timeout: ensure loading screen disappears after max 1.5s
    const timer = setTimeout(() => {
      if (!resolved) {
        setLoading(false);
      }
    }, 1500);

    // 1. Check for stored custom JWT or Demo session
    try {
      const storedAuth = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (parsed && parsed.user) {
          const userVal = parsed.user;
          resolved = true;
          setTimeout(() => {
            setUser(userVal);
            setLoading(false);
          }, 0);
        }
      }
    } catch (e) {
      console.error('Failed to parse local auth session:', e);
    }

    // 2. Listen for Firebase Auth changes
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          resolved = true;
          clearTimeout(timer);
          if (currentUser) {
            const appUser: AppUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            };
            setUser(appUser);

            try {
              const token = await currentUser.getIdToken();
              await fetch('/api/users/sync', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: currentUser.displayName || '',
                }),
              });
            } catch (e) {
              console.error('Error auto-syncing user:', e);
            }
          } else {
            const localAuth = localStorage.getItem(AUTH_STORAGE_KEY);
            if (!localAuth) {
              setUser(null);
            }
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firebase auth state error:', error);
          resolved = true;
          clearTimeout(timer);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Firebase auth initialization catch:', err);
      resolved = true;
      clearTimeout(timer);
      setTimeout(() => setLoading(false), 0);
    }

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const signInAsDemo = async (): Promise<AppUser> => {
    const demoUser: AppUser = {
      uid: 'demo_user_123',
      email: 'demo@horological.com',
      displayName: 'Investidor Demo',
    };
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: 'demo_token', user: demoUser })
    );
    setUser(demoUser);
    setLoading(false);
    return demoUser;
  };

  const signInWithGoogle = async (): Promise<AppUser | null> => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      const result = await signInWithPopup(auth, googleAuthProvider);
      const appUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
      setUser(appUser);
      const token = await result.user.getIdToken();
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: result.user.displayName || '',
        }),
      });
      return appUser;
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string): Promise<AppUser | null> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await safeFetchJson(res);
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao realizar cadastro.');
      }

      const appUser: AppUser = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: data.token, user: appUser }));
      setUser(appUser);
      return appUser;
    } catch (error) {
      console.error('Erro no cadastro com Email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<AppUser | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeFetchJson(res);
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      const appUser: AppUser = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: data.token, user: appUser }));
      setUser(appUser);
      return appUser;
    } catch (error) {
      console.error('Erro no login com Email:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Firebase signout warning:', e);
      }
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getToken = async (): Promise<string | null> => {
    // 1. Check custom JWT or Demo token
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.token) return parsed.token;
      } catch (e) {
        console.error('Error getting stored token:', e);
      }
    }

    // 2. Check Firebase user ID token
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch (e) {
        console.error('Erro ao obter token do Firebase:', e);
      }
    }

    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemo,
        signOutUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
