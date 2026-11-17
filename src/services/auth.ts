import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive'];
export const OAUTH_PROJECT_ID = firebaseConfig.projectId;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

function buildProvider(forceSelectAccount: boolean): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  for (const scope of SCOPES) {
    provider.addScope(scope);
  }
  if (forceSelectAccount) {
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  return provider;
}

let isSigningIn = false;
// In-memory cache of OAuth access tokens keyed by normalized account ID (email)
const accountTokens = new Map<string, string>();
let primaryAccountId: string | null = null;

export function normalizeAccountId(user: User): string {
  return (user.email || user.uid).toLowerCase();
}

export const initAuth = (
  onAuthSuccess?: (user: User, accountId: string, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const accountId = normalizeAccountId(user);
      const token = accountTokens.get(accountId);
      if (token && !isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, accountId, token);
      } else if (!isSigningIn && accountTokens.size === 0) {
        accountTokens.clear();
        primaryAccountId = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else if (!isSigningIn) {
      accountTokens.clear();
      primaryAccountId = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface SignInResult {
  user: User;
  accountId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  accessToken: string;
}

export const googleSignIn = async (
  forceAccountPicker = false
): Promise<SignInResult | null> => {
  try {
    isSigningIn = true;
    const provider = buildProvider(forceAccountPicker);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    const accountId = normalizeAccountId(result.user);
    const email = result.user.email || accountId;
    const displayName = result.user.displayName || email;

    accountTokens.set(accountId, credential.accessToken);
    if (!primaryAccountId) {
      primaryAccountId = accountId;
    }

    return {
      user: result.user,
      accountId,
      email,
      displayName,
      photoURL: result.user.photoURL,
      accessToken: credential.accessToken,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (accountId?: string): Promise<string | null> => {
  if (accountId) {
    return accountTokens.get(accountId) || null;
  }
  if (primaryAccountId) {
    return accountTokens.get(primaryAccountId) || null;
  }
  const first = accountTokens.values().next();
  return first.done ? null : first.value;
};

export const clearAccessToken = (accountId?: string) => {
  if (accountId) {
    accountTokens.delete(accountId);
  } else {
    accountTokens.clear();
    primaryAccountId = null;
  }
};

export const logout = async () => {
  await auth.signOut();
  accountTokens.clear();
  primaryAccountId = null;
};
