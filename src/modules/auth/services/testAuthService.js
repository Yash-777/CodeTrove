/**
 * src/modules/auth/services/testAuthService.js
 * ------------------------------------------------------------------
 * Test Authentication Service - NO FIREBASE REQUIRED
 * Uses localStorage for session persistence.
 * Perfect for development and GitHub Pages deployment.
 *
 * Test Users (hardcoded for demo):
 *   admin / admin123
 *   editor / editor123
 *   viewer / viewer123
 *
 * Interface matches firebaseAuthService - swap services without
 * changing component code.
 */

const STORAGE_KEY = 'codetrove_current_user';
const USERS_STORAGE_KEY = 'codetrove_test_users';
const DELAY_MS = 500;

const TEST_USERS = {
  'admin@test.com': { uid: 'test-admin-001', email: 'admin@test.com', displayName: 'Test Admin', password: 'admin123', role: 'admin' },
  'editor@test.com': { uid: 'test-editor-001', email: 'editor@test.com', displayName: 'Test Editor', password: 'editor123', role: 'editor' },
  'viewer@test.com': { uid: 'test-viewer-001', email: 'viewer@test.com', displayName: 'Test Viewer', password: 'viewer123', role: 'viewer' },
};

function delay() {
  return new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function readUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    return { ...TEST_USERS, ...stored };
  } catch {
    return { ...TEST_USERS };
  }
}

function writeUsers(users) {
  const persisted = Object.fromEntries(
    Object.entries(users).filter(([email]) => !TEST_USERS[email] || users[email].password !== TEST_USERS[email].password || users[email].uid !== TEST_USERS[email].uid)
  );
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(persisted));
}

function toPublicUser(user) {
  if (!user) return null;
  const { password, ...publicUser } = user;
  return { ...publicUser, sessions: publicUser.sessions || [] };
}

async function signIn(email, password) {
  await delay();
  const normalizedEmail = normalizeEmail(email);
  const user = readUsers()[normalizedEmail];
  if (!user || user.password !== password) {
    const error = new Error('Invalid email or password. Use one of the test accounts shown in the documentation.');
    error.code = 'auth/invalid-credential';
    throw error;
  }

  const publicUser = toPublicUser(user);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(publicUser));
  return publicUser;
}

async function signUp(email, password, displayName = '') {
  await delay();
  const normalizedEmail = normalizeEmail(email);
  const users = readUsers();
  if (users[normalizedEmail]) {
    const error = new Error('An account already exists for that email.');
    error.code = 'auth/email-already-in-use';
    throw error;
  }

  const user = {
    uid: `test-user-${Date.now()}`,
    email: normalizedEmail,
    displayName: displayName.trim() || normalizedEmail.split('@')[0],
    password,
    role: 'viewer',
    sessions: [],
  };
  users[normalizedEmail] = user;
  writeUsers(users);

  const publicUser = toPublicUser(user);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(publicUser));
  return publicUser;
}

async function signOut() {
  await delay();
  localStorage.removeItem(STORAGE_KEY);
}

function restoreSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function getCurrentUser() {
  return restoreSession();
}

function isAuthenticated() {
  return Boolean(getCurrentUser());
}

function hasRole(role) {
  return getCurrentUser()?.role === role;
}

function listUsers() {
  return Object.values(readUsers()).map(toPublicUser);
}

function updateUserRole(uid, role) {
  const users = readUsers();
  const entry = Object.entries(users).find(([, user]) => user.uid === uid);
  if (!entry) throw new Error('Test user not found.');
  entry[1].role = role;
  users[entry[0]] = entry[1];
  writeUsers(users);

  const currentUser = restoreSession();
  if (currentUser?.uid === uid) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPublicUser(entry[1])));
  }
  return toPublicUser(entry[1]);
}

export const testAuthService = {
  TEST_USERS,
  signIn,
  signUp,
  signOut,
  restoreSession,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  listUsers,
  updateUserRole,
};
