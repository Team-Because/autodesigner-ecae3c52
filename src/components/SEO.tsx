import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://bdesign.teambecause.com";
export const SITE_NAME = "B Design by Because";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/pricing". No trailing slash (except "/" itself). */
  path: string;
  image?: string;
  /** Pass false for routes that should not be indexed (auth-gated app screens). */
  index?: boolean;
  /** Optional JSON-LD blocks. Each item is a serialisable object. */
  jsonLd?: object[];
  ogType?: "website" | "article";
}

export const SEO = ({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  index = true,
  jsonLd = [],
  ogType = "website",
}: SEOProps) => {
  const canonical = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={index ? "index,follow" : "noindex,follow"} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
};
