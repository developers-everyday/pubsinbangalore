import { NextResponse } from "next/server";
import { getLocalities } from "@/lib/supabase/queries";

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pubsinbangalore.com";
};

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const baseUrl = getSiteUrl();

  try {
    const localities = await getLocalities();

    const urlEntries = localities.map((locality) => {
      return `  <url>
    <loc>${baseUrl}/pubs/in/${locality.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating localities sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

