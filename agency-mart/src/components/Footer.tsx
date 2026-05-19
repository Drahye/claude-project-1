import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/products'

function BarcodeFooter({ count = 50 }: { count?: number }) {
  const bars = Array.from({ length: count }, () => ({
    h: Math.random() > 0.3 ? (Math.random() > 0.5 ? 28 : 20) : 12,
    w: Math.random() > 0.65 ? 3 : 2,
  }))
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 28, justifyContent: 'center' }}>
      {bars.map((b, i) => <span key={i} style={{ background: 'currentColor', display: 'block', height: b.h, width: b.w }} />)}
    </div>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#1a1a1a', color: '#f5f0e8', position: 'relative', zIndex: 1 }}>
      {/* Torn edge top */}
      <div style={{ height: 20, overflow: 'hidden' }}>
        <svg width="100%" height="20" preserveAspectRatio="none">
          <path d={Array.from({ length: 60 }, (_, i) => `${i === 0 ? 'M' : 'L'}${i * (100 / 59)}%,${i % 2 === 0 ? 0 : 20}`).join(' ') + ' L100%,20 L0,20 Z'} fill="#f5f0e8" />
        </svg>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 32px', fontFamily: 'Space Mono, monospace' }}>
        {/* Top section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>

          {/* Brand column */}
          <div>
            <div style={{ fontSize: 'clamp(1.1rem,2.5vw,1.6rem)', fontWeight: 700, letterSpacing: '6px', marginBottom: 12 }}>★ AGENCY MART ★</div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '2px', opacity: 0.5, lineHeight: 2 }}>
              YOUR ONE-STOP CREATIVE<br />SOLUTION SUPERSTORE<br />EST. {year}
            </div>
            <div style={{ marginTop: 16 }}>
              <BarcodeFooter count={44} />
              <div style={{ fontSize: '0.5rem', letterSpacing: '4px', opacity: 0.35, textAlign: 'center', marginTop: 5 }}>5 90000 00000 0</div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '4px', opacity: 0.45, marginBottom: 14, borderBottom: '1px dashed rgba(245,240,232,0.2)', paddingBottom: 8 }}>DEPARTMENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {CATEGORIES.map(c => (
                <Link key={c.id} to={`/category/${c.id}`}
                  style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '0.65rem', letterSpacing: '2px', opacity: 0.65, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}
                >
                  {c.icon} {c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Help */}
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '4px', opacity: 0.45, marginBottom: 14, borderBottom: '1px dashed rgba(245,240,232,0.2)', paddingBottom: 8 }}>CUSTOMER SERVICE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {['TRACK ORDER', 'RETURNS & EXCHANGES', 'SIZING GUIDE', 'FAQ', 'CONTACT US'].map(l => (
                <a key={l} href="#" style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '0.62rem', letterSpacing: '2px', opacity: 0.55, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}>{l}</a>
              ))}
            </div>
          </div>

          {/* Newsletter / receipt */}
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '4px', opacity: 0.45, marginBottom: 14, borderBottom: '1px dashed rgba(245,240,232,0.2)', paddingBottom: 8 }}>JOIN OUR MAILING LIST</div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', opacity: 0.55, marginBottom: 12, lineHeight: 1.8 }}>
              GET 10% OFF YOUR FIRST ORDER.<br />NO SPAM. NO NONSENSE.
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              <input type="email" placeholder="YOUR@EMAIL.COM"
                style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,240,232,0.2)',
                  color: '#f5f0e8', padding: '8px 10px', fontSize: '0.6rem', fontFamily: 'Space Mono, monospace',
                  letterSpacing: '1.5px', flex: 1, outline: 'none',
                }} />
              <button style={{
                background: '#f5f0e8', color: '#1a1a1a', border: 'none', padding: '8px 12px',
                fontSize: '0.58rem', fontFamily: 'Space Mono, monospace', letterSpacing: '2px', cursor: 'pointer',
              }}>JOIN</button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed rgba(245,240,232,0.18)', paddingTop: 24 }}>

          {/* Payment icons (text) */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: '0.52rem', letterSpacing: '3px', opacity: 0.35, marginBottom: 8 }}>ACCEPTED PAYMENT METHODS</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              {['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL', 'CRYPTO'].map(p => (
                <div key={p} style={{
                  border: '1px solid rgba(245,240,232,0.2)', padding: '3px 10px',
                  fontSize: '0.52rem', letterSpacing: '2px', opacity: 0.45,
                }}>{p}</div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.52rem', letterSpacing: '2px', opacity: 0.35 }}>
              © {year} AGENCY MART™ · ALL RIGHTS RESERVED · COME BACK SOON
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {['PRIVACY', 'TERMS', 'COOKIES'].map(l => (
                <a key={l} href="#" style={{ color: '#f5f0e8', textDecoration: 'none', fontSize: '0.52rem', letterSpacing: '2px', opacity: 0.35 }}>{l}</a>
              ))}
            </div>
          </div>

          {/* Final receipt line */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.52rem', letterSpacing: '3px', opacity: 0.25, lineHeight: 2 }}>
            THANK YOU FOR SHOPPING · SURVEY: AGENCYMART.COM/SURVEY<br />
            YOUR BUSINESS IS OUR BUSINESS. LITERALLY.
          </div>
        </div>
      </div>
    </footer>
  )
}
