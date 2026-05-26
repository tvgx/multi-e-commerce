'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { signUp } from '@/lib/auth-client';

export default function RegisterPage() {
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
      const { error: authError } = await signUp.email(
        { email, password, name },
        {
          onSuccess: () => {
            // autoSignInAfterSignUp=true nên redirect thẳng về dashboard
            router.push('/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Registration failed');
          },
        },
      );
      if (authError) {
        setError(authError.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Zap className="text-white w-7 h-7 fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">OmniCommerce</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400 mb-8 text-sm">Join OmniCommerce and start your 60-second journey.</p>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-black/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-black/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-black/60"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-base font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-white font-semibold hover:text-indigo-400 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
