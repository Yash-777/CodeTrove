/**
 * src/context/AuthContext.jsx
 * ------------------------------------------------------------------
 * React Context = a way to make a value (here: the logged-in user +
 * their role) available to ANY component in the tree without passing
 * it down as props through every layer in between ("prop drilling").
 * AuthProvider wraps the whole app once in main.jsx; any component
 * anywhere can then call useAuth() to read { user, profile, ... }.
 *
 * WHAT'S STORED WHERE:
 *   Firebase Auth   -> identity (email + password), via the SDK
 *   Firestore doc    -> everything ELSE about the user: their role
 *   `users/{uid}`       (admin/editor/viewer) and their active
 *                       session device IDs, per your requirement to
 *                       store "user details ... with all the
 *                       permission" in Firestore.
 *
 * SESSION LIMIT (max 2 devices per account):
 * Each browser has a random device ID (utils/deviceId.js). On sign
 * in, we check the user's Firestore doc: if this device is already
 * known, let it through; if there's room (<2 devices), register it;
 * otherwise block the sign-in with a friendly message. Read the
 * honesty note in deviceId.js - this is a demo-level cap enforced by
 * client code, not a tamper-proof security boundary (a real one
 * needs server-issued tokens / Cloud Functions).
 */

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';
import { getDeviceId } from '../utils/deviceId.js';

const MAX_DEVICES = 2;
const DEV_MODE_ADMIN = import.meta.env.DEV && import.meta.env.VITE_DEV_ADMIN === 'true';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase Auth user object (or null)
  const [profile, setProfile] = useState(null);  // Firestore users/{uid} doc: { email, role, sessions }
  const [loading, setLoading] = useState(true);

  // DEV MODE: automatically create a fake admin user for development
  useEffect(() => {
    if (DEV_MODE_ADMIN) {
      console.log('🔐 DEV MODE ADMIN: Auto-authenticated as admin (no Firebase login required)');
      setUser({
        uid: 'dev-admin-uid',
        email: 'dev@admin.local',
        displayName: 'Dev Admin',
      });
      setProfile({
        email: 'dev@admin.local',
        role: 'admin',
        displayName: 'Dev Admin',
      });
      setLoading(false);
      return;
    }

    // Normal Firebase auth flow
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  // Whenever the logged-in user changes, subscribe to their Firestore
  // profile doc in real time (onSnapshot, not one-time getDoc) - so
  // if an admin changes someone's role, that person's UI updates
  // live, without needing to refresh or sign out/in again.
  useEffect(() => {
    if (!user || !db) {
      setProfile(null);
      return;
    }
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
    });
    return unsubscribeProfile;
  }, [user, db]);

  async function signUp(email, password) {
    if (!auth || !db) {
      console.error('signUp: Firebase is not configured. Please check your .env file and ensure VITE_FIREBASE_API_KEY and other Firebase credentials are filled in. See README.md "Setting up Firebase" for instructions.');
      throw new Error(
        'Firebase is not configured. Please check your .env file and ensure VITE_FIREBASE_API_KEY and other Firebase credentials are filled in. See README.md "Setting up Firebase" for instructions.'
      );
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const deviceId = getDeviceId();
    // New accounts default to "viewer" - an admin has to promote
    // someone to "editor" or "admin" afterwards (see /admin/users).
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      role: 'viewer',
      createdAt: serverTimestamp(),
      sessions: [deviceId],
    });
  }

  async function signIn(email, password) {
    if (!auth || !db) {
      console.error('signIn: Firebase is not configured. Please check your .env file and ensure VITE_FIREBASE_API_KEY and other Firebase credentials are filled in. See README.md "Setting up Firebase" for instructions.');
      throw new Error(
        'Firebase is not configured. Please check your .env file and ensure VITE_FIREBASE_API_KEY and other Firebase credentials are filled in. See README.md "Setting up Firebase" for instructions.'
      );
    }
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const deviceId = getDeviceId();
    const userRef = doc(db, 'users', credential.user.uid);
    const snap = await getDoc(userRef);
    const sessions = snap.exists() ? snap.data().sessions || [] : [];

    if (sessions.includes(deviceId)) {
      return; // already a known device - nothing more to do
    }

    if (sessions.length >= MAX_DEVICES) {
      // Over the limit - sign back out immediately so the browser
      // doesn't end up in a half-authenticated state, then surface a
      // clear, friendly reason to the sign-in form.
      await firebaseSignOut(auth);
      const error = new Error(
        `To keep LearnTogether fast and fair for everyone, each account can be signed in on up to ${MAX_DEVICES} devices at a time. This account is already using its limit - sign out on another device first, or contact an admin.`
      );
      error.code = 'session-limit-reached';
      throw error;
    }

    await updateDoc(userRef, { sessions: arrayUnion(deviceId) });
  }

  async function signOutCurrentDevice() {
    if (DEV_MODE_ADMIN) {
      setUser(null);
      setProfile(null);
      return;
    }
    if (user) {
      const deviceId = getDeviceId();
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const remaining = (snap.data().sessions || []).filter((id) => id !== deviceId);
        await updateDoc(userRef, { sessions: remaining });
      }
    }
    await firebaseSignOut(auth);
  }

  /** Frees up every OTHER device slot, keeping only this one - lets
   * someone locked out on a new device reclaim access themselves. */
  async function signOutOtherDevices() {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { sessions: [getDeviceId()] });
  }

  const value = {
    user,
    profile,
    role: profile?.role ?? 'viewer',
    loading,
    signUp,
    signIn,
    signOutCurrentDevice,
    signOutOtherDevices,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook every component uses to read auth state: `const { user, role } = useAuth();` */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}