'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@ecommerce/ui-registry/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ecommerce/ui-registry/src/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Wallet } from 'lucide-react';

export default function WalletTopupConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wallet/topup/token/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Yêu cầu nạp tiền không hợp lệ hoặc đã hết hạn');
        }

        setTokenInfo(data);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
  }, [token, API_BASE]);

  const handleAction = async (action: 'confirm' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/topup/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Xác nhận nạp tiền thất bại');
      }

      setStatus('success');
      setMessage(
        action === 'confirm'
          ? 'Đã xác nhận nạp tiền. Số dư ví của khách đã được cộng.'
          : 'Đã từ chối yêu cầu nạp tiền.'
      );
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-emerald-600">
        <CardHeader className="text-center pb-2">
          <Wallet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <CardTitle className="text-2xl">Xác nhận nạp tiền vào ví</CardTitle>
          <CardDescription className="text-base mt-2">
            Cửa hàng <strong className="text-slate-900">{tokenInfo?.shopName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-emerald-50 p-6 rounded-xl text-center">
            <p className="text-sm text-emerald-600 font-medium mb-1">Số tiền nạp</p>
            <p className="text-4xl font-bold text-emerald-700">
              {tokenInfo?.amount?.toLocaleString('vi-VN')} đ
            </p>
          </div>

          {tokenInfo?.customer && (
            <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-1">
              <p><strong>Khách hàng:</strong> {tokenInfo.customer.name || 'N/A'}</p>
              <p><strong>Email:</strong> {tokenInfo.customer.email}</p>
            </div>
          )}

          <p className="text-sm text-slate-500 text-center">
            Chỉ xác nhận khi bạn đã nhận được tiền chuyển khoản của khách.
          </p>
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base shadow-md"
            disabled={actionLoading}
            onClick={() => handleAction('confirm')}
          >
            {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Đã nhận tiền
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
