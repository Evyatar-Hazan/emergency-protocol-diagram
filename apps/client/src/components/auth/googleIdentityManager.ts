import type {
  CredentialResponse,
  GsiButtonConfiguration,
  IdConfiguration,
} from '@react-oauth/google';

export interface GoogleLoginAttempt {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface GoogleIdentityApi {
  initialize: (configuration: IdConfiguration) => void;
  renderButton: (parent: HTMLElement, configuration: GsiButtonConfiguration) => void;
}

type CredentialHandler = (
  response: CredentialResponse,
  attempt: GoogleLoginAttempt | null
) => void;

export function createGoogleIdentityManager() {
  let initializedClientId: string | null = null;
  let activeAttempt: GoogleLoginAttempt | null = null;
  let credentialHandler: CredentialHandler | null = null;

  return {
    initialize(
      api: GoogleIdentityApi,
      clientId: string,
      onCredential: CredentialHandler
    ) {
      credentialHandler = onCredential;

      if (initializedClientId) {
        if (initializedClientId !== clientId) {
          throw new Error('Google Identity was already initialized with a different client ID');
        }

        return false;
      }

      api.initialize({
        client_id: clientId,
        callback: (response) => {
          const attempt = activeAttempt;
          activeAttempt = null;
          credentialHandler?.(response, attempt);
        },
      });
      initializedClientId = clientId;

      return true;
    },

    renderButton(
      api: GoogleIdentityApi,
      parent: HTMLElement,
      configuration: GsiButtonConfiguration,
      attempt: GoogleLoginAttempt
    ) {
      parent.replaceChildren();
      api.renderButton(parent, {
        ...configuration,
        click_listener: () => {
          activeAttempt = attempt;
          configuration.click_listener?.();
        },
      });

      return () => {
        if (activeAttempt === attempt) {
          activeAttempt = null;
        }
      };
    },
  };
}

export const googleIdentityManager = createGoogleIdentityManager();
