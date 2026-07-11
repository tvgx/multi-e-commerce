'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslations, useLocale } from '@ecommerce/i18n/src/react';
import { useShopBase } from '../../lib/use-shop-base';

/**
 * Đánh giá sản phẩm (TODO 1, 2) — nối API thật `/interactions/reviews` qua BFF:
 *   GET  {base}/api/store/interactions/reviews?productId=  (public, kèm stats avg)
 *   POST {base}/api/store/interactions/reviews             (cần đăng nhập + đơn delivered)
 * "Real-time": polling mỗi 30s (đủ cho demo) + optimistic refresh sau khi gửi.
 */

interface Review {
    id: string;
    customerName?: string | null;
    rating: number;
    title?: string | null;
    body?: string | null;
    createdAt: string;
}

interface ProductReviewsProps {
    productId: string;
    className?: string;
}

const POLL_MS = 30_000;

export function ProductReviews({ productId, className = '' }: ProductReviewsProps) {
    const t = useTranslations('shop');
    const locale = useLocale();
    const base = useShopBase();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<{ average: number; total: number }>({ average: 0, total: 0 });
    const [loaded, setLoaded] = useState(false);

    const [isWriting, setIsWriting] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        if (!base) return; // builder canvas — không có shop context
        try {
            const res = await fetch(
                `${base}/api/store/interactions/reviews?productId=${encodeURIComponent(productId)}&limit=50`,
                { cache: 'no-store' },
            );
            if (!res.ok) return;
            const body = await res.json();
            const payload = body?.data && Array.isArray(body.data) ? body : body?.data ?? body;
            const items: Review[] = payload?.data ?? [];
            setReviews(items);
            setStats(payload?.stats ?? { average: 0, total: items.length });
        } catch (e) {
            console.error('Failed to load reviews', e);
        } finally {
            setLoaded(true);
        }
    }, [base, productId]);

    useEffect(() => {
        fetchReviews();
        // Cập nhật "real-time" bằng polling — người khác gửi review sẽ thấy trong ≤30s.
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') fetchReviews();
        }, POLL_MS);
        return () => clearInterval(timer);
    }, [fetchReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!base) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`${base}/api/store/interactions/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, rating: newRating, body: newContent }),
            });
            if (res.status === 401) {
                setSubmitError(t('reviews.loginToReview'));
                return;
            }
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const msg = body?.message?.message || body?.message || body?.data?.message;
                setSubmitError(typeof msg === 'string' ? msg : t('reviews.submitError'));
                return;
            }
            setIsWriting(false);
            setNewContent('');
            setNewRating(5);
            await fetchReviews();
        } catch {
            setSubmitError(t('reviews.submitError'));
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = stats.average || 0;
    const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

    return (
        <div className={`${className}`}>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('reviews.title')}</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl font-black text-slate-900">{averageRating.toFixed(1)}</div>
                        <div>
                            <div className="flex text-amber-400 mb-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-slate-200'}`} />
                                ))}
                            </div>
                            <p className="text-sm text-slate-500">{t('reviews.basedOn', { count: stats.total })}</p>
                        </div>
                    </div>

                    {!isWriting && (
                        <Button
                            onClick={() => setIsWriting(true)}
                            className="mt-4 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
                        >
                            {t('reviews.writeReview')}
                        </Button>
                    )}
                </div>

                <div className="md:w-2/3">
                    {isWriting && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-lg mb-4">{t('reviews.writeYourReview')}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('reviews.ratingLabel')}</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewRating(star)}
                                                className={`p-1 transition-colors ${star <= newRating ? 'text-amber-400' : 'text-slate-300'}`}
                                            >
                                                <Star className="w-8 h-8 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('reviews.reviewLabel')}</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={newContent}
                                        onChange={e => setNewContent(e.target.value)}
                                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand outline-none"
                                        placeholder={t('reviews.reviewPlaceholder')}
                                    />
                                </div>
                                {submitError && (
                                    <p role="alert" className="text-sm text-red-500">{submitError}</p>
                                )}
                                <div className="flex gap-4 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-brand hover:bg-brand/90 text-white"
                                    >
                                        {submitting ? t('reviews.submitting') : t('reviews.submitReview')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setIsWriting(false); setSubmitError(null); }}
                                        disabled={submitting}
                                    >
                                        {t('reviews.cancel')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-6">
                        {loaded && reviews.length === 0 && (
                            <p className="text-sm text-slate-500">{t('reviews.empty')}</p>
                        )}
                        {reviews.map(review => (
                            <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-900">{review.customerName || t('reviews.anonymous')}</p>
                                        <div className="flex text-amber-400 mt-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(review.createdAt).toLocaleDateString(intlLocale)}
                                    </span>
                                </div>
                                {review.title && <p className="font-medium text-slate-800 mt-2 text-sm">{review.title}</p>}
                                {review.body && <p className="text-slate-600 mt-2 text-sm leading-relaxed">{review.body}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
