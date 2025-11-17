import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pubsinbangalore.com";
};

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const baseUrl = getSiteUrl();
  const supabase = getServerSupabaseClient();

  try {
    const { data: pubs, error } = await supabase
      .from("pubs")
      .select("slug, updated_at")
      .eq("status", "operational")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const urlEntries = pubs?.map((pub) => {
      const lastmod = pub.updated_at ? new Date(pub.updated_at).toISOString() : new Date().toISOString();
      return `  <url>
    <loc>${baseUrl}/pubs/${pub.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join("\n") || "";

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
    console.error("Error generating pubs sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

