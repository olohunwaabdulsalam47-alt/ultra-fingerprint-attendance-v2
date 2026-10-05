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

  try {
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
  } catch (error: unknown) {
    const firebaseError =
      error as {
        code?: string;
        message?: string;
      };

    if (
      firebaseError.code !==
      "auth/email-already-in-use"
    ) {
      throw error;
    }

    /*
     * The Firebase account already exists.
     *
     * Try to sign in with the supplied
     * registration password so an existing
     * unverified registration can continue.
     */
    const credential =
      await signInWithEmailAndPassword(
        firebaseAuth,
        normalizedEmail,
        password,
      );

    await reload(credential.user);

    /*
     * If the account is already verified,
     * registration should not create another
     * school account.
     */
    if (credential.user.emailVerified) {
      await signOut(firebaseAuth);

      throw new Error(
        "This email address is already registered and verified. Please use a different email address.",
      );
    }

    /*
     * Existing account is not verified.
     * Send the verification email again and
     * allow the current registration flow to
     * continue.
     */
    await sendEmailVerification(
      credential.user,
    );

    return credential.user;
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    throw new Error(
      "No Firebase account is currently signed in.",
    );
  }

  await reload(user);

  if (user.emailVerified) {
    throw new Error(
      "This email address is already verified.",
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
