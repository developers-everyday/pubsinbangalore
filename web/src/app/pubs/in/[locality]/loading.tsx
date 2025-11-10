export default function LocalityLoading() {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
