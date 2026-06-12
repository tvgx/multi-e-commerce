'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { loginCustomer, registerCustomer } from '@/app/actions/auth.actions';
import { Button } from '@ecommerce/ui-registry/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ecommerce/ui-registry/src/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';

export default function AccountLoginPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = use(params);
    const router = useRouter();
    const t = useTranslations('auth');
    
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
                    // Redirect to profile on success
                    router.push(`/${shopSlug}/profile`);
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
                        router.push(`/${shopSlug}/profile`);
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
