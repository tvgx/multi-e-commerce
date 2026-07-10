'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useTranslations } from '@ecommerce/i18n/src/react';

export default function ChangePasswordPage() {
  const t = useTranslations('admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { changePassword, error } = useChangePassword();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    const ok = await changePassword(currentPassword, newPassword);
    if (ok) {
      setSuccess(t('auth.change.success'));
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">{t('auth.change.heading')}</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 mb-4 text-center">{success}</p>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('auth.change.currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('auth.change.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('auth.change.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
