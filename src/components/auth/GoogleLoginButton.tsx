import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '../../store/authStore';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = '',
}) => {
  const { loginWithGoogle } = useAuthStore();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        onSuccess?.();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Login failed');
      console.error('Login error:', err);
      onError?.(err);
    }
  };

  const handleError = () => {
    const error = new Error('Login with Google failed');
    console.error('Login error:', error);
    onError?.(error);
  };

  return (
    <div className={className}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text="signin_with"
      />
    </div>
  );
};
