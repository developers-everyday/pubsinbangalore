import type { MetadataRoute } from "next";

import { getLocalities } from "@/lib/supabase/queries";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pubsinbangalore.com";
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Homepage
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  });

  // Pubs index page
  sitemapEntries.push({
    url: `${baseUrl}/pubs`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  });

  try {
    // Get all localities
    const localities = await getLocalities();
    for (const locality of localities) {
      sitemapEntries.push({
        url: `${baseUrl}/pubs/in/${locality.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Get all pubs
    const supabase = getServerSupabaseClient();
    const { data: pubs, error } = await supabase
      .from("pubs")
      .select("slug, updated_at")
      .eq("status", "operational")
      .order("updated_at", { ascending: false });

    if (!error && pubs) {
      for (const pub of pubs) {
        sitemapEntries.push({
          url: `${baseUrl}/pubs/${pub.slug}`,
          lastModified: pub.updated_at ? new Date(pub.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return sitemapEntries;
}

