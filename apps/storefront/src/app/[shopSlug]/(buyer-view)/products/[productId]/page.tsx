import { getShopProductDetails, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/cart/AddToCartButton';

interface Props {
  params: Promise<{ shopSlug: string; productId: string }>;
}

export default async function ProductDetailsPage({ params }: Props) {
  const { shopSlug, productId } = await params;

  try {
    const [productRes, shopInfo] = await Promise.all([
      getShopProductDetails(shopSlug, productId),
      getShopInfo(shopSlug)
    ]);

    const product = productRes?.product;

    if (!product) return notFound();

    // Default to the first variant or use a placeholder
    const defaultVariant = product.variants?.[0] || { _id: 'default', sku: 'DEFAULT', price: product.basePrice, stock: 100 };
    const imageUrl = product.images?.[0] || '';
    const inStock = defaultVariant.stock > 0;

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Image Gallery */}
          <div className="w-full md:w-1/2">
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-slate-300">🖼️</div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div className="mb-4">
              <span className="text-sm font-semibold text-emerald-600 tracking-wider uppercase mb-2 block">
                {product.category || 'General'}
              </span>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{product.name || product.title}</h1>
              <p className="text-3xl font-light text-slate-800">
                {(product.basePrice || product.price).toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="prose prose-slate max-w-none mb-8 text-slate-600">
              <p>{product.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-slate-600">
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200">
              {inStock ? (
                <AddToCartButton 
                  productId={product._id} 
                  variantId={defaultVariant._id} 
                  price={defaultVariant.price || product.basePrice} 
                  title={product.name} 
                  imageUrl={imageUrl} 
                  className="w-full md:w-auto"
                />
              ) : (
                <button disabled className="w-full md:w-auto bg-slate-200 text-slate-500 font-bold py-4 px-8 rounded-xl cursor-not-allowed">
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching product details:', error);
    return notFound();
  }
}
