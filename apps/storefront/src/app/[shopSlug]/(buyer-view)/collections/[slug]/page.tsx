import { getCollectionBySlug, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ shopSlug: string; slug: string }>;
}

export default async function CollectionPage({ params }: Props) {
  const { shopSlug, slug } = await params;

  const [collection, shopInfo] = await Promise.all([
    getCollectionBySlug(shopSlug, slug),
    getShopInfo(shopSlug)
  ]);

  if (!collection) {
    notFound();
  }

  const products = collection.products?.map((pc: any) => pc.product) || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{collection.title}</h1>
        {collection.description && (
          <p className="text-slate-600 max-w-2xl">{collection.description}</p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product: any) => {
             const thumbnail = product.images?.[0] ?? null;
             return (
              <a
                  key={product.id}
                  href={`/${shopSlug}/products/${product.id}`}
                  className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                  <div className="relative h-52 bg-slate-50 overflow-hidden">
                      {thumbnail ? (
                          <img
                              src={thumbnail}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">
                              🖼️
                          </div>
                      )}
                  </div>

                  <div className="p-4">
                      <h2 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                      </h2>
                      <p className="font-bold text-emerald-600">
                          {(product.variants?.[0]?.price || 0).toLocaleString('vi-VN')}đ
                      </p>
                  </div>
              </a>
             );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-slate-500">No products found in this collection.</p>
        </div>
      )}
    </div>
  );
}
