import type { MetadataRoute } from 'next';
import { BACKGROUND_COLOR, SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from '@/shared/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/pharmacy',
    scope: '/',
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
