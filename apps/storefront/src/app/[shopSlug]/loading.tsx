/**
 * Streaming fallback for the whole storefront while the buyer layout fetches
 * shop bootstrap data. Mirrors the header / content / grid so the page doesn't
 * pop when real content arrives.
 */
export default function ShopLoading() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse" aria-hidden="true">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-slate-200" />
          <div className="h-9 w-64 rounded-full bg-slate-100 hidden md:block" />
          <div className="flex gap-4">
            <div className="h-5 w-16 rounded bg-slate-200" />
            <div className="h-5 w-10 rounded bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Hero band */}
      <div className="container mx-auto px-4 py-8">
        <div className="h-64 w-full rounded-2xl bg-slate-100" />
      </div>

      {/* Product grid */}
      <div className="container mx-auto px-4 pb-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="h-52 bg-slate-100" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-16 rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
