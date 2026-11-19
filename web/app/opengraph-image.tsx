import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/shared/config/site';

export const alt = 'blink-a-pill: one medicine list, checked and confirmed by a named professional';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#fcfaf4', color: '#111112' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 44, height: 20, borderRadius: 10, border: '4px solid #111112', display: 'flex', transform: 'rotate(-38deg)' }}>
            <div style={{ width: 18, height: '100%', background: '#0f7a5f', borderRadius: '8px 0 0 8px' }} />
          </div>
          {SITE_NAME}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -3, fontWeight: 600, maxWidth: 980 }}>One medicine list. Checked, and confirmed by a named professional.</div>
          <div style={{ fontSize: 30, color: '#3a3d3e' }}>Duplicate ingredients, interactions and dose limits, routed to the right doctor.</div>
        </div>
      </div>
    ),
    size,
  );
}
