import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

import { auth } from '../firebase/config';

export async function registerUser(email: string, password: string, name?: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (name?.trim()) {
    await updateProfile(userCredential.user, {
      displayName: name.trim(),
    });
  }

  return userCredential;
}

export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential;
}

export async function resetUserPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function isAuthenticated() {
  return auth.currentUser !== null;
}

export function waitForAuthState() {
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        unsubscribe();
        resolve(null);
      }
    );
  });
}
