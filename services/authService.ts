// export type AuthUser = {
//   email: string;
// };

// const MOCK_EMAIL = 'admin@admin.com.br';
// const MOCK_PASSWORD = '1234';

// let currentUser: AuthUser | null = null;

// function validateEmailAndPassword(email: string, password: string) {
//   if (!email.trim() || !password.trim()) {
//     throw new Error('Preencha email e senha.');
//   }
// }

// export async function registerUser(email: string, password: string) {
//   validateEmailAndPassword(email, password);

//   return {
//     user: {
//       email,
//     },
//   };
// }

// export async function loginUser(email: string, password: string) {
//   validateEmailAndPassword(email, password);

//   if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
//     throw new Error('Email ou senha inválidos.');
//   }

//   currentUser = {
//     email,
//   };

//   return {
//     user: currentUser,
//   };
// }

// export async function resetUserPassword(email: string) {
//   if (!email.trim()) {
//     throw new Error('Informe seu email.');
//   }
// }

// export async function logoutUser() {
//   currentUser = null;
// }

// export function isAuthenticated() {
//   return currentUser !== null;
// }

// export function getCurrentUser() {
//   return currentUser;
// }

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';

export async function registerUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function resetUserPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  return signOut(auth);
}

