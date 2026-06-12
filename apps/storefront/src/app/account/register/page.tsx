'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { customerSignUp } from '@/lib/auth-client';

export default function CustomerRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await customerSignUp.email(
        { email, password, name },
        {
          onSuccess: () => {
            router.push('/account/profile');
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Registration failed.');
          },
        },
      );
      if (authError) {
        setError(authError.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Track your orders in real time',
    'Save your shipping addresses',
    'Exclusive member discounts',
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-6">
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-brand/10 blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-100/40 blur-[120px] pointer-events-none translate-y-1/2 translate-x-1/2" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-200 transition-transform group-hover:scale-105">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-stone-800">My Shop</span>
          </Link>
          <p className="text-stone-500 text-sm mt-3">Create your account in seconds</p>
        </div>

        {/* Benefits */}
        <div className="flex flex-col gap-2 mb-6">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2.5 text-sm text-stone-600">
              <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl shadow-stone-100">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-stone-700 block">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-stone-200 rounded-2xl py-3.5 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all bg-stone-50 focus:bg-white"
                  required
                />
              </div>
            </div>

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
              <label className="text-sm font-semibold text-stone-700 block">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
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
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-stone-500 text-sm">
              Already have an account?{' '}
              <Link href="/account/login" className="text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
