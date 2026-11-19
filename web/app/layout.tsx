import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Manrope } from 'next/font/google';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/shared/config/site';
import './tokens/index.css';
import './globals.css';

const manrope = Manrope({ variable: '--font-display', subsets: ['latin'], display: 'swap' });
const geist = Geist({ variable: '--font-ui', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['medication record', 'polypharmacy', 'duplicate medicine', 'drug interaction', 'diabetes', 'hypertension', 'pharmacist', 'ABHA', 'India'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, url: '/', title: SITE_TITLE, description: SITE_DESCRIPTION, locale: 'en_IN' },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfaf4' },
    { media: '(prefers-color-scheme: dark)', color: '#111112' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-IN" className={`${manrope.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
