/**
 * src/modules/auth/AuthContext.jsx
 * ------------------------------------------------------------------
 * Auth Context for managing user authentication state.
 * Uses testAuthService by default (no Firebase required).
 * Can be swapped to firebaseAuthService for production.
 *
 * This modular design allows auth provider swapping without
 * touching any components - just change the import line.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { testAuthService } from './services/testAuthService.js';
// Future Firebase swap: replace the service below with the line that follows.
// import { firebaseAuthService } from './services/firebaseAuthService.js'

const AuthContext = createContext(null);
const authService = testAuthService;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const restoredUser = authService.restoreSession();
    setUser(restoredUser);
    setIsAuthenticated(Boolean(restoredUser));
    setLoading(false);
  }, []);

  async function signIn(email, password) {
    setError(null);
    try {
      const nextUser = await authService.signIn(email, password);
      setUser(nextUser);
      setIsAuthenticated(true);
      return nextUser;
    } catch (err) {
      setError(err);
      setIsAuthenticated(false);
      throw err;
    }
  }

  async function signUp(email, password, displayName) {
    setError(null);
    try {
      const nextUser = await authService.signUp(email, password, displayName);
      setUser(nextUser);
      setIsAuthenticated(true);
      return nextUser;
    } catch (err) {
      setError(err);
      throw err;
    }
  }

  async function signOut() {
    setError(null);
    await authService.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }

  const value = {
    user,
    profile: user,
    role: user?.role ?? 'viewer',
    isAuthenticated,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    hasRole: authService.hasRole,
    // Backward-compatible names used by existing pages.
    signOutCurrentDevice: signOut,
    signOutOtherDevices: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
