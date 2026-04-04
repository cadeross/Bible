import { BRAND_NAME, SITE_DESCRIPTION, getSiteUrl } from "@/lib/seo";

export function SiteStructuredData() {
  const siteUrl = getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: BRAND_NAME,
        url: siteUrl,
        logo: `${siteUrl}/favicon-light.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: BRAND_NAME,
        description: SITE_DESCRIPTION,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
