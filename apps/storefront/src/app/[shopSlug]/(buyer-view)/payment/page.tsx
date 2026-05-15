'use client';

import React, { useState, useEffect, use } from 'react';
import { useCartStore } from '@/store/cart-store';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  CreditCard, 
  Truck, 
  QrCode, 
  X, 
  Info, 
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function CheckoutPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = use(params);
    const router = useRouter();
    const { items, totalAmount, clearCart, shopId, sessionId } = useCartStore();

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        shippingAddress: '',
        paymentMethod: 'COD',
    });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Modal states
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState<any>(null);
    const [showCODConfirm, setShowCODConfirm] = useState(false);

    useEffect(() => {
        if (items.length === 0 && !loading && !showQRModal) {
            router.push(`/${shopSlug}/all-products`);
        }
    }, [items, loading, router, shopSlug, showQRModal]);

    useEffect(() => {
        const fetchShopSettings = async () => {
            if (!shopId) return;
            try {
                const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                const res = await fetch(`${getApiUrl()}/api/shops/${shopId}`);
                const data = await res.json();
                if (data.success && data.data.paymentMethods) {
                    setPaymentMethods(data.data.paymentMethods);
                    // Default to first active method or COD
                    const activeMethods = data.data.paymentMethods.filter((m: any) => m.active);
                    if (activeMethods.length > 0) {
                        setFormData(prev => ({ ...prev, paymentMethod: activeMethods[0].type }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch payment methods", err);
            }
        };
        fetchShopSettings();
    }, [shopId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (!shopId) {
            setError('Shop ID is missing. Please clear cookies and refresh.');
            return false;
        }
        if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Email, Địa chỉ).');
            return false;
        }
        return true;
    }

    const submitOrder = async () => {
        setLoading(true);
        setError('');

        try {
            const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${getApiUrl()}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId || '',
                    'x-shop-id': shopId || '',
                },
                body: JSON.stringify({
                    shopId,
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    shippingAddress: formData.shippingAddress,
                    paymentProvider: formData.paymentMethod,
                    items: items.map((i) => ({
                        productId: i.productId,
                        variantId: i.variantId,
                        quantity: i.quantity,
                        price: i.price,
                    })),
                    totalAmount,
                }),
            });

            const data = await res.json();
            if (data.success) {
                const orderData = data.data;
                
                if (formData.paymentMethod === 'ONLINE_BANKING_QR' && orderData.paymentIntent?.qrCode) {
                    setQrData(orderData.paymentIntent);
                    setShowQRModal(true);
                    await clearCart();
                } else {
                    await clearCart();
                    alert('Đơn hàng đã được đặt thành công! Mã đơn: ' + orderData.number);
                    router.push(`/${shopSlug}`);
                }
            } else {
                setError(data.message || 'Lỗi khi đặt hàng');
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckoutClick = () => {
        if (!validate()) return;
        
        if (formData.paymentMethod === 'COD') {
            setShowCODConfirm(true);
        } else {
            submitOrder();
        }
    };

    if (items.length === 0 && !showQRModal) return null;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Thanh toán</h1>
                <p className="text-slate-500 mt-2">Hoàn tất thông tin để nhận hàng ngay</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 font-bold flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    {/* Section 1: Information */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm italic">01</div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter">Thông tin giao hàng</h2>
                        </div>
                        
                        <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 space-y-5">
                            <div className="relative group">
                                <input 
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl text-base font-bold focus:border-black focus:bg-white outline-none transition-all placeholder:font-medium" 
                                    placeholder="Họ và tên của bạn *" 
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <input 
                                    name="customerEmail"
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl text-base font-bold focus:border-black focus:bg-white outline-none transition-all placeholder:font-medium" 
                                    placeholder="Địa chỉ Email *" 
                                />
                                <input 
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl text-base font-bold focus:border-black focus:bg-white outline-none transition-all placeholder:font-medium" 
                                    placeholder="Số điện thoại" 
                                />
                            </div>
                            
                            <textarea 
                                name="shippingAddress"
                                value={formData.shippingAddress}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl text-base font-bold focus:border-black focus:bg-white outline-none transition-all resize-none placeholder:font-medium" 
                                placeholder="Địa chỉ nhận hàng chi tiết *" 
                                rows={3}
                            ></textarea>
                        </div>
                    </section>

                    {/* Section 2: Payment Method */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm italic">02</div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter">Phương thức thanh toán</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((method) => (
                                    <label 
                                        key={method.id}
                                        className={`group relative flex items-start gap-4 p-6 border-2 rounded-3xl cursor-pointer transition-all ${
                                            formData.paymentMethod === method.type 
                                            ? 'border-black bg-black text-white' 
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="paymentGroup" 
                                            checked={formData.paymentMethod === method.type}
                                            onChange={() => setFormData({...formData, paymentMethod: method.type})}
                                            className="hidden" 
                                        /> 
                                        <div className={`mt-1 p-2 rounded-xl ${formData.paymentMethod === method.type ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                            {method.type === 'ONLINE_BANKING_QR' ? <QrCode size={20} /> : <Truck size={20} />}
                                        </div>
                                        <div>
                                            <span className="block font-black text-sm uppercase tracking-wider">{method.name}</span>
                                            <span className={`text-xs mt-1 block font-medium ${formData.paymentMethod === method.type ? 'text-white/60' : 'text-slate-500'}`}>
                                                {method.description || (method.type === 'ONLINE_BANKING_QR' ? 'Quét mã xác nhận ngay' : 'Thanh toán khi nhận hàng')}
                                            </span>
                                        </div>
                                        {formData.paymentMethod === method.type && (
                                            <div className="absolute top-4 right-4">
                                                <CheckCircle2 size={18} className="text-emerald-400" />
                                            </div>
                                        )}
                                    </label>
                                ))
                            ) : (
                                <div className="col-span-full p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 font-bold">
                                    Đang tải phương thức thanh toán...
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Summary */}
                <div className="lg:pl-4">
                    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 sticky top-24 space-y-8">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-center">Tóm tắt đơn hàng</h2>
                        
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map(item => (
                                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 group">
                                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                                        {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                                        <p className="text-slate-400 text-xs font-bold mt-1">x{item.quantity}</p>
                                        <p className="font-black text-slate-900 text-sm mt-1">
                                            {item.price.toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 border-t-2 border-dashed border-slate-100 pt-8">
                            <div className="flex justify-between text-slate-500 font-bold text-sm uppercase tracking-widest">
                                <span>Tạm tính</span>
                                <span className="text-slate-900">{totalAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-bold text-sm uppercase tracking-widest">
                                <span>Phí vận chuyển</span>
                                <span className="text-emerald-500 font-black italic">Miễn phí</span>
                            </div>
                            <div className="flex justify-between items-end pt-4">
                                <span className="font-black uppercase italic text-lg tracking-tighter">Tổng cộng</span>
                                <span className="text-3xl font-black text-black tabular-nums tracking-tighter">
                                    {totalAmount.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckoutClick}
                            disabled={loading}
                            className="w-full bg-black hover:bg-slate-800 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed text-lg uppercase tracking-widest italic flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>Xác nhận <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <CreditCard size={12} />
                            <span>Bảo mật bởi SSL 256-bit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR CODE MODAL */}
            {showQRModal && qrData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => {
                        setShowQRModal(false);
                        router.push(`/${shopSlug}`);
                    }} />
                    <div className="relative bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
                        <button 
                            onClick={() => {
                                setShowQRModal(false);
                                router.push(`/${shopSlug}`);
                            }}
                            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Quét để thanh toán</h3>
                            <p className="text-slate-500 font-medium">Sử dụng ứng dụng ngân hàng để quét</p>
                        </div>

                        <div className="relative mx-auto w-72 h-72 p-4 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-inner">
                            <img src={qrData.qrCode} alt="Payment QR" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 border-8 border-white rounded-[2.5rem] pointer-events-none" />
                        </div>

                        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 flex items-start gap-3 text-left">
                            <Info className="text-indigo-500 shrink-0" size={20} />
                            <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                                Sau khi quét, bạn sẽ được dẫn tới trang xác nhận giao dịch. Vui lòng bấm <b>Đồng ý</b> tại đó để hoàn tất đơn hàng.
                            </p>
                        </div>

                        <div className="space-y-4">
                             <a 
                                href={qrData.paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
                            >
                                Mở trang xác nhận trực tiếp
                            </a>
                            <button 
                                onClick={() => {
                                    setShowQRModal(false);
                                    router.push(`/${shopSlug}`);
                                }}
                                className="block w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Tôi sẽ thanh toán sau
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COD CONFIRM MODAL */}
            {showCODConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCODConfirm(false)} />
                    <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center space-y-6">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                            <Truck size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Xác nhận đặt hàng?</h3>
                            <p className="text-slate-500 font-medium">Bạn sẽ thanh toán số tiền <span className="text-black font-black">{totalAmount.toLocaleString('vi-VN')}đ</span> khi nhận được hàng.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setShowCODConfirm(false)}
                                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={() => {
                                    setShowCODConfirm(false);
                                    submitOrder();
                                }}
                                className="py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
