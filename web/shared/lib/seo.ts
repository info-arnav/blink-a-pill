import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/shared/config/site';

export const NOINDEX: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'no-referrer',
};

export const PRIVATE_PATHS = ['/r/', '/d/', '/a/', '/c/', '/pharmacy/card/'];

export const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-IN',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    '@id': `${SITE_URL}/#app`,
    name: SITE_NAME,
    operatingSystem: 'iOS, Android',
    applicationCategory: 'MedicalApplication',
    description: SITE_DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${SITE_URL}/#page`,
    url: SITE_URL,
    name: 'How link-a-pill keeps a medicine list safe',
    audience: [
      { '@type': 'MedicalAudience', audienceType: 'Patient' },
      { '@type': 'MedicalAudience', audienceType: 'Clinician' },
    ],
    isPartOf: { '@id': `${SITE_URL}/#website` },
  },
];
