'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { customerSignIn } from '@/lib/auth-client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account/profile';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await customerSignIn.email(
        { email, password },
        {
          onSuccess: () => {
            router.push(callbackUrl);
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Login failed. Please check your credentials.');
          },
        },
      );
      if (authError) {
        setError(authError.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl shadow-stone-100">
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-stone-700 block">Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 transition-colors group-focus-within:text-amber-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-stone-200 rounded-2xl py-3.5 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all bg-stone-50 focus:bg-white"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-stone-700">Password</label>
            <Link href="/account/forgot-password" className="text-xs text-amber-600 hover:text-amber-700 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 transition-colors group-focus-within:text-amber-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-stone-200 rounded-2xl py-3.5 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all bg-stone-50 focus:bg-white"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 py-4 text-base font-bold text-white transition-all hover:shadow-lg hover:shadow-amber-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-stone-100 text-center">
        <p className="text-stone-500 text-sm">
          New customer?{' '}
          <Link href="/account/register" className="text-amber-600 font-semibold hover:text-amber-700 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-100/60 blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-rose-100/40 blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-200 transition-transform group-hover:scale-105">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-stone-800">My Shop</span>
          </Link>
          <p className="text-stone-500 text-sm mt-3">Sign in to your account</p>
        </div>

        {/* Form with Suspense */}
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
