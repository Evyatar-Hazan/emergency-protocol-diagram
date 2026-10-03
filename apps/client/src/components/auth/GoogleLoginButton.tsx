import React, { useEffect, useRef } from 'react';
import { useGoogleIdentityManager } from './googleIdentityManagerContext';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'default' | 'white' | 'outline' | 'icon';
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = '',
  variant = 'default',
}) => {
  const googleIdentity = useGoogleIdentityManager();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!googleIdentity?.isReady || !buttonContainerRef.current) {
      return;
    }

    return googleIdentity.renderButton(
      buttonContainerRef.current,
      { text: 'signin_with' },
      {
        onSuccess,
        onError,
      }
    );
  }, [googleIdentity, onError, onSuccess]);

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
    'outline': 'w-full',
    'icon': 'w-auto'
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <style>{`
        .google-login-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        ${variant === 'icon' ? `
          .google-login-container > div {
            width: 40px !important;
            min-width: 40px !important;
            max-width: 40px !important;
            overflow: hidden !important;
            border-radius: 9999px !important;
          }
          .google-login-container button {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            max-width: 40px !important;
            padding: 0 !important;
            border-radius: 9999px !important;
            border: 1px solid #e2e8f0 !important;
            background-color: white !important;
            box-shadow: none !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            overflow: hidden !important;
          }
          .google-login-container button:hover {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
          }
          .google-login-container button > div {
            margin: 0 !important;
          }
          .google-login-container iframe {
            width: 40px !important;
            min-width: 40px !important;
            max-width: 40px !important;
            border-radius: 9999px !important;
            overflow: hidden !important;
          }
        ` : variant === 'white' ? `
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
        <div ref={buttonContainerRef} className="h-10" />
      </div>
    </div>
  );
};
