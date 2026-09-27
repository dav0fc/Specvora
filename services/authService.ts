import {
  ActionCodeInfo,
  ActionCodeOperation,
  checkActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

import { auth } from '../firebase/config';

// Página web de fallback: se o link do e-mail for aberto fora do app
// (ex.: navegador), a recuperação continua na página do Firebase.
const RESET_EMAIL_FALLBACK_URL = 'https://specvoraauth.firebaseapp.com';

function createAuthError(code: string, message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

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
  // ActionCodeSettings (documentação do Firebase):
  // - handleCodeInApp: true → o link do e-mail abre o app diretamente (deep link).
  //   A tela /reset-password lê o parâmetro `oobCode` da URL e conclui a
  //   recuperação dentro do app (checkActionCode + confirmPasswordReset).
  // - url → destino web de fallback, caso o link seja aberto fora do app.
  await sendPasswordResetEmail(auth, email, {
    url: RESET_EMAIL_FALLBACK_URL,
    handleCodeInApp: true,
  });
}

// Valida o `oobCode` recebido no deep link e confirma que ele é de
// recuperação de senha. Retorna o email da conta (quando informado).
export async function checkPasswordResetCode(oobCode: string): Promise<string | null> {
  const actionCodeInfo: ActionCodeInfo = await checkActionCode(auth, oobCode);

  if (actionCodeInfo.operation !== ActionCodeOperation.PASSWORD_RESET) {
    throw createAuthError(
      'auth/invalid-action-code',
      'O código não é de recuperação de senha.'
    );
  }

  return actionCodeInfo.data?.email ?? null;
}

// Confirma a recuperação definindo a nova senha a partir do `oobCode`.
export async function confirmNewPassword(oobCode: string, newPassword: string) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function logoutUser() {
  await signOut(auth);
}

export function translateAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou senha incorretos.';
    case 'auth/invalid-email':
      return 'Informe um email válido.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/email-already-in-use':
      return 'Este email já está cadastrado.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    case 'auth/invalid-action-code':
    case 'auth/invalid-oob-code':
      return 'O link de recuperação é inválido. Solicite um novo e-mail.';
    case 'auth/expired-action-code':
      return 'O link de recuperação expirou. Solicite um novo e-mail.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada.';
    default:
      return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
  }
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
