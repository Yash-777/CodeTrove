// Static-build compatibility adapter for the existing UsersPage.
// It uses the modular test auth store instead of Firebase/Firestore.
import { testAuthService } from '../modules/auth/services/testAuthService.js';

export function collection(_db, name) {
  return { name };
}

export async function getDocs(reference) {
  if (reference.name !== 'users') throw new Error(`Unsupported static collection: ${reference.name}`);
  const users = testAuthService.listUsers();
  return { docs: users.map((user) => ({ id: user.uid, data: () => user })) };
}

export function doc(_db, collectionName, id) {
  return { collectionName, id };
}

export async function updateDoc(reference, values) {
  if (reference.collectionName !== 'users' || !values?.role) {
    throw new Error('Only user role updates are supported by static test authentication.');
  }
  return testAuthService.updateUserRole(reference.id, values.role);
}
