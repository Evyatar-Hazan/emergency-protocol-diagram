import { createContext, useContext } from 'react';
import type { GsiButtonConfiguration } from '@react-oauth/google';
import type { GoogleLoginAttempt } from './googleIdentityManager';

export interface GoogleIdentityManagerContextValue {
  isReady: boolean;
  renderButton: (
    parent: HTMLElement,
    configuration: GsiButtonConfiguration,
    attempt: GoogleLoginAttempt
  ) => (() => void) | undefined;
}

export const GoogleIdentityManagerContext =
  createContext<GoogleIdentityManagerContextValue | null>(null);

export function useGoogleIdentityManager() {
  return useContext(GoogleIdentityManagerContext);
}
