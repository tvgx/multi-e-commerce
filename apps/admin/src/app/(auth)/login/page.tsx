'use client';
import { useState, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import Link from 'next/link';
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { useTranslations } from '@ecommerce/i18n/src/react';

function LoginContent() {
  const t = useTranslations('admin');

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() =>
    searchParams.get('error') === 'google' ? t('auth.googleFailed') : '',
  );
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    try {
      // Redirects to Google, then back to callbackUrl on success. Requires
      // GOOGLE_CLIENT_ID/SECRET on api-core + the OAuth client redirect URI
      // {BETTER_AUTH_URL}/api/auth/owner/callback/google.
      //
      // callbackURL phải TUYỆT ĐỐI: auth server nằm ở api.<domain> khác origin
      // với admin, better-auth redirect Location nguyên văn nên URL tương đối
      // sẽ đưa user về api.<domain>/dashboard (JSON 404) thay vì admin.
      const absoluteCallback = callbackUrl.startsWith('/')
        ? `${window.location.origin}${callbackUrl}`
        : callbackUrl;
      await signIn.social({
        provider: 'google',
        callbackURL: absoluteCallback,
        errorCallbackURL: `${window.location.origin}/login?error=google`,
      });
    } catch (err: any) {
      setError(err?.message || t('auth.genericError'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await signIn.email(
        { email, password },
        {
          onSuccess: () => {
            router.push(callbackUrl);
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || t('auth.login.failed'));
          },
        },
      );
      if (authError) {
        setError(authError.message || t('auth.login.failed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-slate-200 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Zap className="text-white w-7 h-7 fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">{t('auth.brand')}</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">{t('auth.login.welcomeBack')}</h1>
            <p className="text-slate-400 mb-8 text-sm">{t('auth.login.description')}</p>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">{t('auth.login.email')}</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.login.emailPlaceholder')}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-black/60"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-medium text-slate-300">{t('auth.login.password')}</label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    {t('auth.login.forgot')}
                  </Link>
                </div>
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
                    {t('auth.login.submit')}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">{t('auth.or')}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.6C39.6 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
              </svg>
              {t('auth.google')}
            </button>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                {t('auth.login.noAccount')}{' '}
                <Link href="/register" className="text-white font-semibold hover:text-indigo-400 transition-colors">
                  {t('auth.login.createAccount')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">{t('auth.footer.home')}</Link>
          <Link href="/legal/privacy" className="hover:text-slate-300 transition-colors">{t('auth.footer.privacy')}</Link>
          <Link href="/legal/terms" className="hover:text-slate-300 transition-colors">{t('auth.footer.terms')}</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
