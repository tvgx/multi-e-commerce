/** Content skeleton for shop dashboard pages (renders inside the dark shell). */
export default function ShopDashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-8 w-56 rounded bg-white/10" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/5 bg-white/5" />
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-white/10" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-white/5" />
        ))}
      </div>
    </div>
  );
}
