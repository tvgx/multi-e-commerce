'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shopId: string;
  redirectUrl?: string;
}

export function DynamicRegisterForm({ shopId, redirectUrl = '/' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_BASE}/api/storefront-auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, shopId }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      localStorage.setItem(`storefront_token_${shopId}`, data.data.token);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create Account</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
