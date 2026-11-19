import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/shared/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/pharmacy`, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
