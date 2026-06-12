/** Content skeleton for platform-level dashboard pages. */
export default function PlatformLoading() {
  return (
    <div className="p-6 md:p-10 animate-pulse" aria-hidden="true">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-64 rounded bg-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
