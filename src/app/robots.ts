import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/_next/",
        "/settings/",
        "/subscription/",
        "/test-auth/",
      ],
    },
    sitemap: "https://ctenarsky-denik.vercel.app/sitemap.xml",
  };
}
