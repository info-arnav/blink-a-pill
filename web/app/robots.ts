import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/shared/config/site';
import { PRIVATE_PATHS } from '@/shared/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/pharmacy'], disallow: PRIVATE_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
