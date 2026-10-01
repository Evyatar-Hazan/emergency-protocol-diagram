import { useCallback, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { useGoogleOAuth } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '../../store/authStore';
import {
  googleIdentityManager,
  type GoogleIdentityApi,
  type GoogleLoginAttempt,
} from './googleIdentityManager';
import {
  GoogleIdentityManagerContext,
  type GoogleIdentityManagerContextValue,
} from './googleIdentityManagerContext';

function getGoogleIdentityApi() {
  return (
    window as typeof window & {
      google?: { accounts?: { id?: GoogleIdentityApi } };
    }
  ).google?.accounts?.id;
}

export function GoogleIdentityManagerProvider({ children }: PropsWithChildren) {
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const handleCredential = useCallback(
    async (
      response: CredentialResponse,
      attempt: GoogleLoginAttempt | null
    ) => {
      try {
        if (!response.credential) {
          throw new Error('Login with Google failed');
        }

        await loginWithGoogle(response.credential);
        attempt?.onSuccess?.();
      } catch (error) {
        const loginError = error instanceof Error ? error : new Error('Login failed');
        console.error('Login error:', loginError);
        attempt?.onError?.(loginError);
      }
    },
    [loginWithGoogle]
  );

  const value = useMemo<GoogleIdentityManagerContextValue>(
    () => ({
      isReady: scriptLoadedSuccessfully,
      renderButton: (parent, configuration, attempt) => {
        const api = getGoogleIdentityApi();

        if (!api) {
          return undefined;
        }

        googleIdentityManager.initialize(api, clientId, handleCredential);
        return googleIdentityManager.renderButton(api, parent, configuration, attempt);
      },
    }),
    [clientId, handleCredential, scriptLoadedSuccessfully]
  );

  return (
    <GoogleIdentityManagerContext.Provider value={value}>
      {children}
    </GoogleIdentityManagerContext.Provider>
  );
}
