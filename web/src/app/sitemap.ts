import type { MetadataRoute } from "next";

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pubsinbangalore.com";
};

// Main sitemap - only includes static/core pages
// Dynamic content (pubs, localities) are in separate sitemaps for better performance
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const currentDate = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pubs`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}

