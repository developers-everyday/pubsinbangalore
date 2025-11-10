export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Admin</p>
          <h1 className="text-2xl font-semibold">PubsInBangalore Control Center</h1>
          <p className="text-sm text-slate-400">
            Manage data ingestion, listing updates, ownership claims, and community reports.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
