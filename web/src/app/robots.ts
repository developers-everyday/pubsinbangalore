import type { MetadataRoute } from "next";

const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://pubsinbangalore.com";
};

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

