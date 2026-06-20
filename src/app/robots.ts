import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://passgrid.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sign-in", "/sign-up"],
      disallow: [
        "/passwords/",
        "/cards/",
        "/health/",
        "/edit-profile/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
