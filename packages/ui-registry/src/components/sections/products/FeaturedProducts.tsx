import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { cn } from '../../../lib/utils';
import { SmartImage } from '../../blocks/SmartImage';
import { DEFAULT_IMG } from '../../../lib/media';
import { formatPrice } from '../../../lib/format';
import { normalizeProducts, productHref } from '../../../lib/products';
import { shopHref } from '../../../lib/href';
import { tFor } from '../../../lib/i18n-server';
import { sectionStyle } from '../../../lib/section-style';

/** Block con của thẻ sản phẩm (Phase B): bật/tắt, đổi thứ tự, chỉnh props. */
export interface ProductCardBlock {
    id: string;
    componentId: string;
    props?: Record<string, any>;
    isHidden?: boolean;
}

interface FeaturedProductProps {
    productId?: string;
    mediaLayout?: string;
    backgroundImageUrl?: string;
    title?: string;
    subtitle?: string;
    badgeText?: string;
    ctaLink?: string;
    paddingY?: string;
    backgroundColor?: string;
    textColor?: string;
    blocks?: ProductCardBlock[];
    /** Danh sách sản phẩm thật — inject từ pageContext (storefront) / preview (builder). */
    products?: any[];
    basePath?: string;
    locale?: string;
}

export function FeaturedProducts({
    productId,
    mediaLayout = 'left',
    backgroundImageUrl,
    title,
    subtitle,
    badgeText,
    ctaLink,
    paddingY,
    backgroundColor,
    textColor,
    blocks = [],
    products,
    basePath,
    locale,
}: FeaturedProductProps) {
    const isRight = mediaLayout === 'right';
    const t = tFor(locale);
    const badge = badgeText || t('shop:featured.badge');

    // Sản phẩm hiển thị: ưu tiên sản phẩm owner chọn (productId), fallback sản
    // phẩm đầu tiên của shop. Props (title/ảnh/mô tả) luôn override data thật.
    const catalog = normalizeProducts(products);
    const product = catalog.find((p) => p.id === productId) || catalog[0];

    const displayImage = backgroundImageUrl || product?.image || DEFAULT_IMG;
    const displayTitle = title || product?.name || 'The Ultimate Everyday Sneaker.';
    const displaySubtitle =
        subtitle ||
        product?.description ||
        "Engineered for all-day comfort with our proprietary cloud-foam tech. This isn't just a shoe, it's a statement.";
    // Demo canvas (chưa có sản phẩm) dùng giá mẫu 149.000đ — format theo locale như giá thật.
    const displayPrice = formatPrice(product ? product.basePrice : 149000, { locale });
    const buyLink = ctaLink
        ? shopHref(basePath || '', ctaLink)
        : (product ? productHref(basePath, product.id) : undefined);

    // Layout cũ (chưa có blocks) giữ nguyên; layout mới render theo blocks —
    // block bị ẩn (isHidden) không hiện, thứ tự block quyết định thứ tự phần tử.
    const visible = blocks.filter((b) => !b.isHidden);
    const hasBlocks = blocks.length > 0;
    const has = (cid: string) => !hasBlocks || visible.some((b) => b.componentId === cid);
    const propsOf = (cid: string) => visible.find((b) => b.componentId === cid)?.props ?? {};

    const showImage = has('ProductCardImage');
    const showName = has('ProductCardName');
    const showPrice = has('ProductCardPrice');
    const showButton = has('ProductCardButton');
    const showRating = has('ProductCardRating');

    return (
        <section className="w-full px-4 md:px-12 bg-slate-900 text-white" style={sectionStyle({ paddingY, backgroundColor, textColor })}>
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                {showImage && (
                    <div className={cn('lg:w-1/2 w-full', isRight ? 'lg:order-2' : 'lg:order-1')}>
                        <div className="aspect-square bg-slate-800 rounded-full overflow-hidden relative shadow-2xl shadow-brand/20 p-4">
                            <div className="w-full h-full rounded-full overflow-hidden border border-slate-700">
                                <SmartImage
                                    src={displayImage}
                                    alt={displayTitle}
                                    className={cn(
                                        'w-full h-full scale-110',
                                        propsOf('ProductCardImage').fit === 'contain' ? 'object-contain' : 'object-cover',
                                    )}
                                />
                            </div>
                            {showRating && (
                                <div className="absolute top-1/4 -left-4 bg-white text-slate-900 px-4 py-2 rounded-xl font-bold shadow-xl rotate-[-5deg]">
                                    {propsOf('ProductCardRating').label || t('shop:featured.topRated')}
                                </div>
                            )}
                            {badge && (
                                <div className="absolute bottom-1/4 -right-4 bg-brand text-white px-4 py-2 rounded-xl font-bold shadow-xl rotate-[5deg]">{badge}</div>
                            )}
                        </div>
                    </div>
                )}

                <div className={cn('lg:w-1/2 w-full space-y-8 text-center lg:text-left', isRight ? 'lg:order-1' : 'lg:order-2')}>
                    {showName && (
                        <HeadingBlock
                            content={displayTitle}
                            level="h2"
                            alignment="left"
                            className="text-5xl md:text-6xl font-black italic tracking-tighter"
                        />
                    )}
                    <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        {displaySubtitle}
                    </p>

                    {(showPrice || showButton) && (
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                            {showPrice && <span className="text-4xl font-bold">{displayPrice}</span>}
                            {showButton && (
                                <ButtonBlock
                                    label={propsOf('ProductCardButton').label || t('shop:featured.addToCart')}
                                    link={buyLink}
                                    style="primary"
                                    size="lg"
                                    className="w-full sm:w-auto bg-brand hover:opacity-90 text-brand-fg rounded-full shadow-lg shadow-brand/20"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export const featuredProductSchema = {
    name: 'Featured Product',
    category: 'Products',
    settings: [
        { id: 'productId', type: 'product', label: 'Sản phẩm hiển thị' },
        { id: 'backgroundImageUrl', type: 'image', label: 'Ảnh sản phẩm (để trống dùng ảnh SP)' },
        { id: 'title', type: 'text', label: 'Tiêu đề (để trống dùng tên SP)' },
        { id: 'subtitle', type: 'textarea', label: 'Mô tả ngắn (để trống dùng mô tả SP)' },
        { id: 'badgeText', type: 'text', label: 'Nhãn góc ảnh', default: 'Limited Stock' },
        { id: 'mediaLayout', type: 'segmented', label: 'Vị trí hình ảnh', options: ['left', 'right'] },
        { id: 'paddingY', type: 'segmented', label: 'Khoảng đệm dọc', options: [
            { value: 'compact', label: 'Gọn' }, { value: 'normal', label: 'Vừa' }, { value: 'spacious', label: 'Rộng' },
        ], default: 'normal' },
        { id: 'backgroundColor', type: 'color', label: 'Màu nền', default: '#0f172a' },
        { id: 'textColor', type: 'color', label: 'Màu chữ', default: '#ffffff' },
    ],
};
