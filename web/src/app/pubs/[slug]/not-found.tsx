import Link from "next/link";

export default function PubNotFound() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">We could not find that pub.</h2>
      <p className="mt-3 text-sm text-slate-600">
        Run the ingestion CLI with Supabase keys to publish fresh listings.
      </p>
      <Link
        href="/pubs"
        className="mt-6 inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Back to directory
      </Link>
    </div>
  );
}
