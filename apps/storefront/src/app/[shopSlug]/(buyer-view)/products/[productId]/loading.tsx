/** Skeleton for the product detail page (image + info two-column layout). */
export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-12 animate-pulse" aria-hidden="true">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 aspect-square md:min-h-[500px] bg-slate-100" />
          <div className="md:w-1/2 p-8 md:p-12 space-y-6">
            <div className="h-9 w-3/4 rounded bg-slate-200" />
            <div className="h-8 w-32 rounded bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-20 rounded-lg bg-slate-100" />
              <div className="h-10 w-20 rounded-lg bg-slate-100" />
            </div>
            <div className="h-12 w-48 rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
