import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { GoogleLoginButton } from './GoogleLoginButton';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <div className="w-full lg:w-auto">
        <GoogleLoginButton variant="white" />
      </div>
    );
  }

  return (
    <div className="relative w-full lg:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full lg:w-auto flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-500 lg:hover:bg-gray-100 transition text-white lg:text-gray-800"
        title={user.email}
      >
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="text-start flex-1 lg:flex-none">
          <p className="text-sm font-medium">
            {user.name?.split(' ')[0] || user.email.split('@')[0]}
          </p>
        </div>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 lg:right-0 mt-2 w-full lg:w-48 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-800">{user.name || user.email}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {user.isAdmin && (
              <p className="text-xs text-blue-600 font-semibold mt-2">👑 Admin</p>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            יציאה
          </button>
        </div>
      )}
    </div>
  );
};
