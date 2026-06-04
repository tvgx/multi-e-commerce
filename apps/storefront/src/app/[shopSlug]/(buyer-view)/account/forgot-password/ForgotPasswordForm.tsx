'use client';
import React, { useState } from 'react';

export function ForgotPasswordForm({ shopSlug, shopId }: { shopSlug: string; shopId: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`/api/api-core/storefront-auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, shopId, shopSlug }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.data?.message || 'If the email exists, a reset link will be sent.');
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Quên mật khẩu</h1>
        <p className="text-slate-500 mb-6">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
        
        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-6 text-sm">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          <a href={`/${shopSlug}/account/login`} className="text-emerald-600 hover:text-emerald-700 font-medium">
            Quay lại đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}
