import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '../../store/authStore';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'default' | 'white' | 'outline';
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  variant = 'default',
}) => {
  const { loginWithGoogle } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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

  if (!googleClientId || googleClientId.includes('your_google_client_id_here')) {
    return (
      <div className={`${className} rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right`}>
        <p className="text-sm font-semibold text-amber-900">התחברות Google לא זמינה כרגע</p>
        <p className="mt-1 text-xs leading-6 text-amber-800">
          כדי להגיב, להשיב או לעשות לייק צריך התחברות Google פעילה. כרגע אפשר רק לקרוא את הדיון.
        </p>
      </div>
    );
  }

  // קבע עיצוב בהתאם לvariant
  const containerClasses = {
    'default': 'w-full',
    'white': 'w-full',
    'outline': 'w-full'
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <style>{`
        .google-login-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        ${variant === 'white' ? `
          .google-login-container > div {
            width: 100% !important;
          }
          .google-login-container button {
            width: 100% !important;
            background-color: white !important;
            border: 2px solid #e5e7eb !important;
            color: #374151 !important;
            font-weight: 600 !important;
            padding: 10px 16px !important;
            border-radius: 8px !important;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
          }
          .google-login-container button:hover {
            background-color: #f3f4f6 !important;
            border-color: #d1d5db !important;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          }
        ` : `
          .google-login-container > div {
            width: 100% !important;
          }
          .google-login-container button {
            width: 100% !important;
            background-color: white !important;
            border: 1px solid #d1d5db !important;
            color: #374151 !important;
            font-weight: 500 !important;
            padding: 10px 16px !important;
            border-radius: 6px !important;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
          }
          .google-login-container button:hover {
            background-color: #f9fafb !important;
            border-color: #9ca3af !important;
          }
        `}
      `}</style>
      <div className="google-login-container">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text="signin_with"
        />
      </div>
    </div>
  );
};
