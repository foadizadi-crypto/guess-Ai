/**
 * Web does not use Play Services. Login uses Firebase popup/redirect instead.
 */
export function isNativeGoogleSignInConfigured(): boolean {
  return true;
}

export async function promptNativeGoogleIdToken(): Promise<string> {
  throw new Error('Use signInWithGoogle() on web.');
}

export async function signOutGooglePlay(): Promise<void> {}
