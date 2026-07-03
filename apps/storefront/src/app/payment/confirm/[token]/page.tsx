'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ecommerce/ui-registry/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ecommerce/ui-registry/src/components/ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';

export default function PaymentConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Fetch token info
    const fetchTokenInfo = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/payments/token-info/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Invalid or expired token');
        }
        
        setTokenInfo(data.data);
        
        // Calculate time left in seconds
        const expiresAt = new Date(data.data.expiresAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((expiresAt - now) / 1000);
        setTimeLeft(Math.max(0, diff));
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenInfo();
  }, [token]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus('error');
          setMessage('Payment token has expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAction = async (action: 'confirm' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment confirmation failed');
      }

      setStatus('success');
      setMessage(`Thanh toán đã được ${action === 'confirm' ? 'xác nhận' : 'từ chối'} thành công.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Thành công!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-700">Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Xác nhận thanh toán</CardTitle>
          <CardDescription className="text-base mt-2">
            Cửa hàng <strong className="text-slate-900">{tokenInfo?.shopName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-blue-50 p-6 rounded-xl text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Số tiền cần thanh toán</p>
            <p className="text-4xl font-bold text-blue-700">
              {formatPrice(tokenInfo?.amount)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-amber-50 text-amber-800 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium">Vui lòng hoàn tất thanh toán trong:</p>
              <p className="text-xl font-bold font-mono tracking-wider mt-1 text-amber-700">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4 pt-4 pb-6">
          <Button
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 h-12"
            disabled={actionLoading}
            onClick={() => handleAction('reject')}
          >
            Từ chối
          </Button>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-md"
            disabled={actionLoading || timeLeft <= 0}
            onClick={() => handleAction('confirm')}
          >
            {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Đã thanh toán
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
