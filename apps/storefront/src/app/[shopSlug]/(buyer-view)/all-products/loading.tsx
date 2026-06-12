/** Skeleton for the product listing page (matches container + sidebar + grid). */
export default function AllProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-12 animate-pulse" aria-hidden="true">
      <div className="h-8 w-48 rounded bg-slate-200 mb-2" />
      <div className="h-4 w-32 rounded bg-slate-100 mb-8" />

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-60 shrink-0 space-y-4">
          <div className="h-5 w-24 rounded bg-slate-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-100" />
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
}
