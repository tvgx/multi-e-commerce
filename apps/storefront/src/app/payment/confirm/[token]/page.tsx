'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ecommerce/ui-registry/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ecommerce/ui-registry/src/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentConfirmPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Note: in a real app, we should fetch the order details associated with the token 
  // via a GET request to display amount and order number before the user confirms.

  const handleAction = async (action: 'confirm' | 'reject') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment confirmation failed');
      }

      setStatus('success');
      setMessage(`Payment has been successfully ${action}ed.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Success!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{message}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/')}>Return to Store</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-700">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{message}</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => setStatus('idle')}>Try Again</Button>
            <Button className="ml-2" onClick={() => router.push('/')}>Return to Store</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Confirm Bank Transfer</CardTitle>
          <CardDescription>
            You are about to confirm a bank transfer payment.
            Please ensure you have transferred the correct amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Token: <span className="font-mono bg-gray-100 p-1 rounded">{params.token}</span>
          </p>
        </CardContent>
        <CardFooter className="flex gap-4 pt-4">
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={loading}
            onClick={() => handleAction('reject')}
          >
            Reject Payment
          </Button>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
            onClick={() => handleAction('confirm')}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirm Transfer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
