'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/button';

interface Review {
    id: string;
    author: string;
    rating: number;
    content: string;
    date: string;
}

interface ProductReviewsProps {
    productId: string;
    initialReviews?: Review[];
    className?: string;
}

export function ProductReviews({ productId, initialReviews = [], className = '' }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews.length > 0 ? initialReviews : [
        // Mock data if none provided
        { id: '1', author: 'Jane Doe', rating: 5, content: 'Absolutely love this product! The quality is amazing.', date: '2026-05-15' },
        { id: '2', author: 'John Smith', rating: 4, content: 'Great value for money. Shipping was a bit slow though.', date: '2026-05-10' }
    ]);
    
    const [isWriting, setIsWriting] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Mock API call
        setTimeout(() => {
            const review: Review = {
                id: Math.random().toString(),
                author: 'You', // In a real app, from user session
                rating: newRating,
                content: newContent,
                date: new Date().toISOString().split('T')[0]
            };
            setReviews([review, ...reviews]);
            setIsWriting(false);
            setNewContent('');
            setNewRating(5);
            setSubmitting(false);
        }, 800);
    };

    return (
        <div className={`mt-16 border-t border-slate-100 pt-16 ${className}`}>
            <div className="flex flex-col md:flex-row gap-8 mb-12">
                <div className="md:w-1/3">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Customer Reviews</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl font-black text-slate-900">{averageRating.toFixed(1)}</div>
                        <div>
                            <div className="flex text-amber-400 mb-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`w-5 h-5 ${star <= averageRating ? 'fill-current' : 'text-slate-200'}`} />
                                ))}
                            </div>
                            <p className="text-sm text-slate-500">Based on {reviews.length} reviews</p>
                        </div>
                    </div>
                    
                    {!isWriting && (
                        <Button 
                            onClick={() => setIsWriting(true)}
                            className="mt-4 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
                        >
                            Write a Review
                        </Button>
                    )}
                </div>

                <div className="md:w-2/3">
                    {isWriting && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-lg mb-4">Write your review</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Review</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={newContent}
                                        onChange={e => setNewContent(e.target.value)}
                                        className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="What did you like or dislike?"
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => setIsWriting(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-900">{review.author}</p>
                                        <div className="flex text-amber-400 mt-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">{review.date}</span>
                                </div>
                                <p className="text-slate-600 mt-3 text-sm leading-relaxed">{review.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
