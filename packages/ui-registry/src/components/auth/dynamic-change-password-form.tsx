'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shopId: string;
  redirectUrl?: string;
}

export function DynamicChangePasswordForm({ shopId, redirectUrl = '/' }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem(`storefront_token_${shopId}`);
      if (!token) throw new Error('You must be logged in to change password');

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_BASE}/api/storefront-auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword, shopId }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Change password failed');
      }
      
      setSuccess('Password updated successfully');
      setTimeout(() => router.push(redirectUrl), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Change Password</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-500 mb-4 text-center">{success}</p>}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
