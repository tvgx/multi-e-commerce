'use client';

import React, { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginCustomer, registerCustomer } from '@/app/actions/auth.actions';
import { Button } from '@ecommerce/ui-registry/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ecommerce/ui-registry/src/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';

export default function AccountLoginPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('auth');

    // Where to land after auth — falls back to the profile page. Used by the
    // guest-checkout flow to return the buyer to checkout after logging in.
    const redirectParam = searchParams.get('redirect');
    const destination = redirectParam && redirectParam.startsWith(`/${shopSlug}`)
        ? redirectParam
        : `/${shopSlug}/profile`;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            if (mode === 'login') {
                const res = await loginCustomer(shopSlug, formData);
                if (res.error) {
                    setError(res.error);
                } else {
                    router.push(destination);
                    router.refresh();
                }
            } else {
                const res = await registerCustomer(shopSlug, formData);
                if (res.error) {
                    setError(res.error);
                } else {
                    // Automatically log in after registration
                    const loginRes = await loginCustomer(shopSlug, formData);
                    if (loginRes.error) {
                        setMode('login');
                        setError(t('login.accountCreated'));
                    } else {
                        router.push(destination);
                        router.refresh();
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || t('login.genericError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
            <Card className="w-full max-w-md shadow-xl border-slate-100">
                <CardHeader className="space-y-2 text-center pb-8">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {mode === 'login' ? t('login.welcomeBack') : t('signup.title')}
                    </CardTitle>
                    <CardDescription>
                        {mode === 'login'
                            ? t('login.loginDescription')
                            : t('login.registerDescription')
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}
                        
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">{t('login.fullName')}</label>
                                <input 
                                    name="fullName"
                                    type="text" 
                                    required 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('login.email')}</label>
                            <input 
                                name="email"
                                type="email" 
                                required 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-700">{t('login.password')}</label>
                                {mode === 'login' && (
                                    <a href={`/${shopSlug}/account/forgot-password`} className="text-sm text-brand hover:text-brand hover:underline">
                                        {t('login.forgotPassword')}
                                    </a>
                                )}
                            </div>
                            <input 
                                name="password"
                                type="password" 
                                required 
                                minLength={6}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-6 text-base font-bold mt-4 bg-brand hover:bg-brand/90 text-white rounded-xl shadow-md transition-all disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (mode === 'login' ? t('login.submit') : t('signup.submit'))}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">{t('login.or', { defaultValue: 'hoặc' })}</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <a
                        href={`${apiBase}/api/storefront-auth/google/start?shopSlug=${encodeURIComponent(shopSlug)}&redirect=${encodeURIComponent(destination)}`}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.6C39.6 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
                        </svg>
                        {t('login.continueWithGoogle', { defaultValue: 'Tiếp tục với Google' })}
                    </a>
                </CardContent>
                <CardFooter className="flex flex-col border-t border-slate-100 pt-6">
                    <p className="text-sm text-slate-500 text-center">
                        {mode === 'login' ? t('login.noAccount') : t('signup.haveAccount')}
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="ml-2 text-brand font-bold hover:underline"
                        >
                            {mode === 'login' ? t('login.signupCta') : t('login.loginCta')}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
