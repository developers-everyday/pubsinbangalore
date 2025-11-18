import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SearchForm } from "@/components/search/search-form";
import { LocalityResults } from "@/components/search/locality-results";
import { getLocalities, getLocalityBySlug, getLocalityPageData } from "@/lib/supabase/queries";
import { getCanonicalUrl } from "@/lib/utils/canonical";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";

export const revalidate = 21600;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const localities = await getLocalities();
  return localities.slice(0, 10).map((locality) => ({ locality: locality.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locality: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const localityInfo = await getLocalityBySlug(resolvedParams.locality);

  if (!localityInfo) {
    return {
      title: "Locality not found",
      description: "This Bangalore locality does not exist yet.",
    };
  }

  const title = `${localityInfo.name} pubs in Bangalore`;
  const description = `Discover pubs in ${localityInfo.name}, Bangalore with curated details on cover charges, cost for two, and live events.`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(`/pubs/in/${resolvedParams.locality}`),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://pubsinbangalore.com/pubs/in/${resolvedParams.locality}`,
      locale: "en_IN",
      siteName: "PubsInBangalore",
      images: [
        {
          url: "https://pubsinbangalore.com/og-image.png",
          width: 1200,
          height: 630,
          alt: `${localityInfo.name} pubs in Bangalore`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://pubsinbangalore.com/og-image.png"],
      creator: "@pubsinbangalore",
      site: "@pubsinbangalore",
    },
  };
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ locality: string }>;
}) {
  const resolvedParams = await params;
  const { locality, pubs } = await getLocalityPageData(resolvedParams.locality, {
    sort: "rating_desc",
    limit: 120,
  });

  if (!locality) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${locality.name} pubs in Bangalore`,
    itemListElement: pubs.map((pub, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://pubsinbangalore.com/pubs/${pub.slug}`,
      name: pub.name,
    })),
  };

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Pubs", url: "/pubs" },
    { name: locality.name, url: `/pubs/in/${resolvedParams.locality}` },
  ];

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      ></script>

      <Breadcrumbs items={breadcrumbItems} />
      <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Locality spotlight
          </p>
          <h2 className="text-3xl font-bold text-slate-900">
            Pubs in {locality.name}, {locality.city}
          </h2>
          <p className="max-w-3xl text-base text-slate-600">
            Discover rooftop breweries, live music nights, and late-night venues curated for {locality.name}.
            Use the filters below to narrow down by budget, entry perks, or amenities.
          </p>
        </div>
        <SearchForm placeholder={`Search within ${locality.name}`} />
      </header>

      <LocalityResults localityName={locality.name} pubs={pubs} />
    </div>
  );
}
