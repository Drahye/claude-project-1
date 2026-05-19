import { useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PRODUCTS, CATEGORIES } from '../data/products'
import { getSharedRenderer } from '../lib/sharedRenderer'
import HeroScene from '../components/HeroScene'
import ProductCard from '../components/ProductCard'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'

gsap.registerPlugin(ScrollTrigger)

// ── TICKER ────────────────────────────────────────────────
const TICK = '✦ HATS ✦ SHOES ✦ BAGS ✦ JUGS ✦ BOOKS ✦ FREE SHIPPING OVER $100 ✦ NEW ARRIVALS IN STOCK ✦ RETURNS ACCEPTED ✦ SALE ON NOW ✦ '
function Ticker({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{
      overflow: 'hidden', padding: '10px 0', whiteSpace: 'nowrap',
      borderTop: `2px dashed ${dark ? 'rgba(245,240,232,0.25)' : 'rgba(26,26,26,0.25)'}`,
      borderBottom: `2px dashed ${dark ? 'rgba(245,240,232,0.25)' : 'rgba(26,26,26,0.25)'}`,
      position: 'relative', zIndex: 1,
      background: dark ? '#1a1a1a' : 'transparent',
      color: dark ? '#f5f0e8' : '#1a1a1a',
    }}>
      <div style={{ display: 'inline-block', animation: 'ticker 26s linear infinite', fontSize: '0.6rem', letterSpacing: '4px' }}>
        {TICK}{TICK}
      </div>
    </div>
  )
}

// ── SECTION HEADER ────────────────────────────────────────
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32, fontFamily: 'Space Mono, monospace' }}>
      <div style={{ fontSize: '0.56rem', letterSpacing: '5px', opacity: 0.44 }}>{eyebrow}</div>
      <div style={{ fontSize: 'clamp(1rem,2.5vw,1.5rem)', fontWeight: 700, letterSpacing: '6px', marginTop: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: '0.56rem', letterSpacing: '3px', opacity: 0.44, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ── CATEGORY TILE 3D CANVAS ───────────────────────────────
function CategoryTileCanvas({ categoryId }: { categoryId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const meshRef = useRef<THREE.Object3D | null>(null)
  const tileId = `cat-${categoryId}`

  useEffect(() => {
    const canvas = canvasRef.current!
    const p = PRODUCTS.find(prod => prod.category === categoryId)
    if (!p) return
    const tid = setTimeout(() => {
      const mesh = getSharedRenderer().register({ ...p, id: tileId }, canvas)
      meshRef.current = mesh
      const obs = new IntersectionObserver(
        ([e]) => getSharedRenderer().setVisible(tileId, e.isIntersecting),
        { threshold: 0.05 }
      )
      obs.observe(canvas)
    }, 20)
    return () => {
      clearTimeout(tid)
      getSharedRenderer().unregister(tileId)
    }
  }, [categoryId, tileId])

  const onEnter = useCallback(() => {
    getSharedRenderer().setHovered(tileId, true)
    const mesh = meshRef.current
    if (mesh) {
      gsap.to(mesh.rotation, { y: mesh.rotation.y + Math.PI * 2, duration: 1.3, ease: 'power2.inOut' })
      gsap.to(mesh.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.35, ease: 'back.out(1.7)' })
    }
  }, [tileId])

  const onLeave = useCallback(() => {
    getSharedRenderer().setHovered(tileId, false)
    const mesh = meshRef.current
    if (mesh) gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.28 })
  }, [tileId])

  return (
    <div style={{ width: '100%', height: 180, overflow: 'hidden' }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 180 }} />
    </div>
  )
}

// ── CATEGORIES GRID ───────────────────────────────────────
function CategoriesSection() {
  return (
    <section id="categories-section" style={{ padding: '60px 24px', position: 'relative', zIndex: 1, background: '#111' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader eyebrow="BROWSE BY DEPARTMENT" title="SHOP CATEGORIES" sub="SELECT YOUR AISLE" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {CATEGORIES.map(cat => (
            <Link key={cat.id} to={`/category/${cat.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                background: '#1a1a1a', cursor: 'pointer', overflow: 'hidden',
                transition: 'transform 0.25s', border: '1px solid rgba(255,255,255,0.06)',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLDivElement).style.zIndex = '2' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLDivElement).style.zIndex = '' }}
              >
                <CategoryTileCanvas categoryId={cat.id} />
                <div style={{ padding: '14px 16px', fontFamily: 'Space Mono, monospace', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.58rem', letterSpacing: '1.5px', opacity: 0.45, color: '#f5f0e8' }}>{cat.icon} AISLE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '3px', color: '#f5f0e8', marginTop: 2 }}>{cat.label}</div>
                  <div style={{ fontSize: '0.56rem', letterSpacing: '1.5px', opacity: 0.5, color: '#f5f0e8', marginTop: 3 }}>{cat.desc}</div>
                  <div style={{ marginTop: 10, fontSize: '0.55rem', letterSpacing: '3px', color: cat.color }}>BROWSE →</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CART RECEIPT SECTION ──────────────────────────────────
function CartSection() {
  const { items, remove, total, count } = useCart()
  const tax = total * 0.085
  const grand = total + tax

  const dateStr = new Date().toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).toUpperCase()

  return (
    <section id="cart-section" style={{ padding: '60px 24px 80px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 660, margin: '0 auto', fontFamily: 'Space Mono, monospace' }}>
        <SectionHeader eyebrow="CHECKOUT LANE" title="YOUR CART" sub={`${count} ITEM${count !== 1 ? 'S' : ''} IN CART`} />

        <div id="receipt-paper" style={{
          background: '#fff', padding: '36px 30px',
          boxShadow: '4px 4px 0 rgba(26,26,26,0.12)',
          position: 'relative',
        }}>
          {/* Torn top */}
          <div style={{ position: 'absolute', top: -12, left: 0, right: 0, height: 24, overflow: 'hidden' }}>
            <svg width="100%" height="24" preserveAspectRatio="none">
              <path d={Array.from({ length: 40 }, (_, i) => `${i === 0 ? 'M' : 'L'}${i * (100 / 39)}%,${i % 2 === 0 ? 0 : 24}`).join(' ') + ' L100%,24 L0,24 Z'} fill="#fff" />
            </svg>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'flex-end', height: 22, marginBottom: 12 }}>
              {Array.from({ length: 44 }, (_, i) => ({ h: Math.random() > 0.3 ? (Math.random() > 0.5 ? 22 : 15) : 8, w: Math.random() > 0.65 ? 3 : 2 })).map((b, i) => (
                <span key={i} style={{ background: '#1a1a1a', display: 'block', height: b.h, width: b.w }} />
              ))}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '7px' }}>AGENCY MART™</div>
            <div style={{ fontSize: '0.55rem', letterSpacing: '2px', opacity: 0.5, marginTop: 6, lineHeight: 1.9 }}>
              123 CREATIVE BLVD · DIGITAL CITY, WEB 00001<br />
              TEL: (555) ART-0001 · WWW.AGENCYMART.COM
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(26,26,26,0.2)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', letterSpacing: '1.5px', opacity: 0.55 }}>
            <span>{dateStr}</span><span>CASHIER: CLAUDE™</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px dashed rgba(26,26,26,0.2)', margin: '14px 0' }} />

          {/* Line items */}
          <div style={{ minHeight: 80 }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '0.6rem', letterSpacing: '2.5px', opacity: 0.3 }}>
                ~ CART IS EMPTY ~<br />ADD PRODUCTS FROM THE STORE ABOVE
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, padding: '7px 0', fontSize: '0.68rem', letterSpacing: '0.3px', borderBottom: '1px solid rgba(26,26,26,0.08)', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem' }}>{item.name} <span style={{ opacity: 0.45, fontSize: '0.57rem' }}>×{item.qty}</span></span>
                  <span style={{ opacity: 0.4, fontSize: '0.55rem' }}>{item.sku}</span>
                  <span style={{ fontWeight: 700, textAlign: 'right' }}>${(item.price * item.qty).toLocaleString()}</span>
                  <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.6rem', opacity: 0.4, fontFamily: 'Space Mono, monospace', padding: '0 0 0 4px' }}>✕</button>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <>
              <hr style={{ border: 'none', borderTop: '1px dashed rgba(26,26,26,0.2)', margin: '14px 0' }} />
              <div>
                {[['SUBTOTAL', `$${total.toLocaleString()}`], ['TAX (8.5%)', `$${tax.toFixed(2)}`], ['SHIPPING', 'FREE']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', padding: '3px 0', letterSpacing: '1px' }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, borderTop: '3px double #1a1a1a', paddingTop: 8, marginTop: 4, letterSpacing: '2px' }}>
                  <span>TOTAL</span><span>${grand.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          <button className="btn-ink" style={{ marginTop: 22, letterSpacing: '4px' }}>
            [ PROCEED TO CHECKOUT ]
          </button>

          <hr style={{ border: 'none', borderTop: '1px dashed rgba(26,26,26,0.15)', margin: '22px 0 14px' }} />
          <div style={{ textAlign: 'center', fontSize: '0.53rem', letterSpacing: '2px', opacity: 0.45, lineHeight: 2.2 }}>
            THANK YOU FOR SHOPPING AT AGENCY MART™<br />
            YOUR BUSINESS IS OUR BUSINESS. LITERALLY.<br />
            ★ MEMBER SAVINGS THIS VISIT: $0.00 ★
          </div>

          {/* Torn bottom */}
          <div style={{ position: 'absolute', bottom: -12, left: 0, right: 0, height: 24, overflow: 'hidden' }}>
            <svg width="100%" height="24" preserveAspectRatio="none" style={{ transform: 'rotate(180deg)' }}>
              <path d={Array.from({ length: 40 }, (_, i) => `${i === 0 ? 'M' : 'L'}${i * (100 / 39)}%,${i % 2 === 0 ? 0 : 24}`).join(' ') + ' L100%,24 L0,24 Z'} fill="#fff" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── HOME PAGE ─────────────────────────────────────────────
export default function Home() {
  const featured = PRODUCTS.filter(p => p.isFeatured)
  const newArrivals = PRODUCTS.filter(p => p.isNew)
  const onSale = PRODUCTS.filter(p => p.onSale)

  useEffect(() => {
    const cards = document.querySelectorAll('.product-card')
    cards.forEach((card, i) => {
      gsap.fromTo(card, { y: 50, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.6, delay: i * 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%' }
      })
    })
    gsap.fromTo('#receipt-paper', { y: 35, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '#receipt-paper', start: 'top 82%' }
    })
    gsap.utils.toArray('.category-tile').forEach((el, i) => {
      gsap.fromTo(el as Element, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.55, delay: i * 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: el as Element, start: 'top 88%' }
      })
    })
  }, [])

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <HeroScene />
      <Ticker />

      {/* FEATURED */}
      <section id="products-section" style={{ padding: '60px 24px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionHeader eyebrow="★ HAND-PICKED ★" title="FEATURED PRODUCTS" sub="OUR BEST SELLERS — EDITOR'S SELECTION" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <Ticker />

      {/* CATEGORIES */}
      <CategoriesSection />

      <Ticker dark />

      {/* NEW ARRIVALS */}
      <section style={{ padding: '60px 24px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionHeader eyebrow="JUST LANDED" title="NEW ARRIVALS" sub="FRESH STOCK — STRAIGHT OFF THE TRUCK" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <Ticker />

      {/* ON SALE */}
      <section style={{ padding: '60px 24px', position: 'relative', zIndex: 1, background: 'rgba(193,18,31,0.04)', borderTop: '2px dashed rgba(193,18,31,0.18)', borderBottom: '2px dashed rgba(193,18,31,0.18)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="⚠ LIMITED TIME ONLY ⚠"
            title="ON SALE — SLASHED PRICES"
            sub="CLEARANCE · PRICES SLASHED · WHILE STOCK LASTS"
          />
          {/* Sale banner */}
          <div style={{
            background: '#C1121F', color: '#fff', textAlign: 'center', padding: '10px',
            fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', letterSpacing: '4px',
            marginBottom: 28,
          }}>
            ★ UP TO 35% OFF — USE CODE: RECEIPT35 AT CHECKOUT ★
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {onSale.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <Ticker />

      {/* TESTIMONIALS */}
      <Testimonials />

      <Ticker dark />

      {/* CART */}
      <CartSection />

      <Footer />
    </div>
  )
}
