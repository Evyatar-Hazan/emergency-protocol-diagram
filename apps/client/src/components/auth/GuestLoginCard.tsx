import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

interface GuestLoginCardProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  compact?: boolean;
}

export const GuestLoginCard: React.FC<GuestLoginCardProps> = ({
  onSuccess,
  onError,
  compact = false,
}) => {
  const { loginAsGuest, isLoading } = useAuthStore();
  const [name, setName] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await loginAsGuest(name.trim());
      setName('');
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Guest login failed'));
    }
  };

  return (
    <form onSubmit={submit} className={`space-y-3 ${compact ? '' : 'rounded-[24px] border border-slate-200 bg-white/70 p-4'}`}>
      <div>
        <label htmlFor="guest-name" className="mb-1 block text-sm font-semibold text-slate-800">
          שם לתצוגה בדיון
        </label>
        <input
          id="guest-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="למשל: יעל - תרגול BLS"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-clinical-blue focus:ring-2 focus:ring-clinical-blue/15"
          minLength={2}
          maxLength={40}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || name.trim().length < 2}
        className="w-full rounded-2xl bg-clinical-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-clinical-deep disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isLoading ? 'נכנס...' : 'כניסה מהירה לדיון'}
      </button>

      <p className="text-xs leading-6 text-slate-500">
        כניסה מהירה מיועדת לתרגול ולמידה. בהמשך אפשר יהיה להחליף לחשבון מזוהה מלא.
      </p>
    </form>
  );
};
