import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  reload,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "./firebaseConfig";

export async function registerFirebaseUser(
  email: string,
  password: string,
): Promise<User> {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required.",
    );
  }

  if (!password) {
    throw new Error(
      "Password is required.",
    );
  }

  const credential =
    await createUserWithEmailAndPassword(
      firebaseAuth,
      normalizedEmail,
      password,
    );

  await sendEmailVerification(
    credential.user,
  );

  return credential.user;
}

export async function resendVerificationEmail(): Promise<void> {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    throw new Error(
      "No Firebase account is currently signed in.",
    );
  }

  await sendEmailVerification(user);
}

export async function refreshFirebaseUser(): Promise<User | null> {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    return null;
  }

  await reload(user);

  return firebaseAuth.currentUser;
}

export async function isFirebaseEmailVerified(): Promise<boolean> {
  const user =
    await refreshFirebaseUser();

  return user?.emailVerified === true;
}

export async function loginFirebaseUser(
  email: string,
  password: string,
): Promise<User> {
  const normalizedEmail =
    email.trim().toLowerCase();

  const credential =
    await signInWithEmailAndPassword(
      firebaseAuth,
      normalizedEmail,
      password,
    );

  await reload(credential.user);

  if (!credential.user.emailVerified) {
    await signOut(firebaseAuth);

    throw new Error(
      "Please verify your email address before signing in.",
    );
  }

  return credential.user;
}

export async function logoutFirebaseUser(): Promise<void> {
  await signOut(firebaseAuth);
}
