export default function PubDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
