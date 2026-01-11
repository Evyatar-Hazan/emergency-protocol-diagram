import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { GoogleLoginButton } from './GoogleLoginButton';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { isLoading, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      onLoginSuccess?.();
    }
  }, [user, onLoginSuccess]);

  const handleLoginSuccess = () => {
    setError(null);
    onLoginSuccess?.();
  };

  const handleLoginError = (err: Error) => {
    setError(err.message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Emergency Protocols
          </h1>
          <p className="text-gray-600">
            Sign in to access protocols and add comments
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex justify-center mb-6">
          <GoogleLoginButton
            onError={handleLoginError}
            onSuccess={handleLoginSuccess}
          />
        </div>

        {isLoading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-4">Signing in...</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            🔒 Security & Privacy
          </h3>
          <ul className="text-xs text-gray-600 space-y-2">
            <li>• Your data is encrypted and secure</li>
            <li>• We use Google OAuth for authentication</li>
            <li>• No passwords are stored</li>
            <li>• Only your name and email are used</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
