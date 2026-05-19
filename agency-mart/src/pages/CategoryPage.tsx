import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PRODUCTS, CATEGORIES } from '../data/products'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'

gsap.registerPlugin(ScrollTrigger)

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'name'
type Filter = 'all' | 'new' | 'sale' | 'featured'

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { count } = useCart()
  const [sort, setSort] = useState<SortKey>('default')
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState('')

  const cat = CATEGORIES.find(c => c.id === categoryId)
  const allCatProducts = PRODUCTS.filter(p => p.category === categoryId)

  const filtered = allCatProducts.filter(p => {
    if (filter === 'new') return p.isNew
    if (filter === 'sale') return p.onSale
    if (filter === 'featured') return p.isFeatured
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    if (sort === 'rating') return b.rating - a.rating
    if (sort === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    const cards = document.querySelectorAll('.product-card')
    cards.forEach((card, i) => {
      gsap.fromTo(card, { y: 45, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.55, delay: i * 0.07, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%' }
      })
    })
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [categoryId, filter, sort])

  if (!cat) return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', padding: 40 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '4px', opacity: 0.4 }}>ERROR 404</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '4px', margin: '12px 0' }}>CATEGORY NOT FOUND</div>
        <Link to="/" style={{ color: '#1a1a1a', fontSize: '0.65rem', letterSpacing: '3px' }}>← RETURN TO STORE</Link>
      </div>
    </div>
  )

  const btnStyle = (active: boolean) => ({
    fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '2px',
    padding: '7px 14px', border: '1px solid rgba(26,26,26,0.25)',
    background: active ? '#1a1a1a' : 'transparent',
    color: active ? '#f5f0e8' : '#1a1a1a',
    cursor: 'pointer', transition: 'all 0.2s',
  } as React.CSSProperties)

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Toast */}
      <div className={`toast-bar${toast ? ' show' : ''}`}>{toast.toUpperCase()}</div>

      {/* Category hero banner */}
      <div style={{
        background: cat.color, color: '#fff', paddingTop: 88,
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        fontFamily: 'Space Mono, monospace',
      }}>
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.35) 0%, transparent 60%)' }} />
        {/* Grid lines decoration */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 28px)' }} />

        <div style={{ position: 'relative', padding: '48px 24px 40px' }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '5px', opacity: 0.65, marginBottom: 12 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>STORE</Link>
            {' '}/{' '}{cat.label}
          </div>
          <div style={{ fontSize: '0.72rem', letterSpacing: '4px', opacity: 0.75, marginBottom: 8 }}>{cat.icon} AISLE</div>
          <div style={{ fontSize: 'clamp(2rem,7vw,4.5rem)', fontWeight: 700, letterSpacing: '10px', lineHeight: 0.95 }}>{cat.label}</div>
          <div style={{ fontSize: '0.65rem', letterSpacing: '3px', opacity: 0.7, marginTop: 14 }}>{cat.desc.toUpperCase()}</div>
          <div style={{ marginTop: 16, fontSize: '0.6rem', letterSpacing: '2px', opacity: 0.55 }}>{allCatProducts.length} PRODUCTS IN STOCK</div>

          {/* Bottom barcode strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'flex-end', height: 22, marginTop: 28 }}>
            {Array.from({ length: 70 }, (_, i) => ({
              h: Math.random() > 0.3 ? (Math.random() > 0.5 ? 22 : 15) : 8, w: Math.random() > 0.65 ? 3 : 2
            })).map((b, i) => <span key={i} style={{ background: 'rgba(255,255,255,0.4)', display: 'block', height: b.h, width: b.w }} />)}
          </div>
        </div>
      </div>

      {/* Filter + sort bar */}
      <div style={{
        borderBottom: '1px dashed rgba(26,26,26,0.2)', padding: '14px 24px',
        position: 'sticky', top: 52, background: 'rgba(245,240,232,0.96)',
        backdropFilter: 'blur(10px)', zIndex: 50,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '2px', opacity: 0.45, alignSelf: 'center', marginRight: 4 }}>FILTER:</span>
            {(['all', 'featured', 'new', 'sale'] as Filter[]).map(f => (
              <button key={f} style={btnStyle(filter === f)} onClick={() => setFilter(f)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '2px', opacity: 0.45 }}>SORT:</span>
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
              style={{
                fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '1.5px',
                border: '1px solid rgba(26,26,26,0.25)', background: 'transparent',
                padding: '6px 10px', cursor: 'pointer', outline: 'none',
              }}>
              <option value="default">DEFAULT</option>
              <option value="price-asc">PRICE ↑</option>
              <option value="price-desc">PRICE ↓</option>
              <option value="rating">TOP RATED</option>
              <option value="name">NAME A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <section style={{ padding: '40px 24px 60px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Space Mono, monospace' }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: '3px', opacity: 0.4 }}>~ NO PRODUCTS MATCH THIS FILTER ~</div>
            <button onClick={() => setFilter('all')} style={{ ...btnStyle(false), marginTop: 16 }}>CLEAR FILTER</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '3px', opacity: 0.4, marginBottom: 20 }}>
              SHOWING {sorted.length} OF {allCatProducts.length} PRODUCTS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {sorted.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </section>

      {/* Other categories */}
      <div style={{ borderTop: '2px dashed rgba(26,26,26,0.15)', padding: '32px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Space Mono, monospace' }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '4px', opacity: 0.4, marginBottom: 16 }}>OTHER AISLES</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.filter(c => c.id !== categoryId).map(c => (
              <Link key={c.id} to={`/category/${c.id}`}
                style={{
                  textDecoration: 'none', padding: '8px 16px',
                  border: `1px solid ${c.color}40`,
                  color: '#1a1a1a', fontSize: '0.6rem', letterSpacing: '2.5px',
                  transition: 'all 0.2s', background: `${c.color}10`,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = c.color; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${c.color}10`; (e.currentTarget as HTMLAnchorElement).style.color = '#1a1a1a' }}
              >
                {c.icon} {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
