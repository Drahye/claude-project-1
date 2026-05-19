import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { CATEGORIES } from '../data/products'
import { useCart } from '../context/CartContext'

export default function Nav() {
  const { count } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [cartBump, setCartBump] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(count)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (count !== prevCount.current && badgeRef.current) {
      gsap.fromTo(badgeRef.current, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)' })
      setCartBump(true); setTimeout(() => setCartBump(false), 500)
      prevCount.current = count
    }
  }, [count])

  const scrollToCart = () => document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' })

  const isHome = location.pathname === '/'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(245,240,232,0.96)' : isHome ? 'transparent' : 'rgba(245,240,232,0.96)',
      backdropFilter: scrolled || !isHome ? 'blur(12px)' : 'none',
      borderBottom: scrolled || !isHome ? '1px dashed rgba(26,26,26,0.2)' : 'none',
      transition: 'all 0.35s ease',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: scrolled ? 52 : isHome ? 64 : 56,
        transition: 'height 0.3s',
        fontFamily: 'Space Mono, monospace',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          textDecoration: 'none',
          color: scrolled || !isHome ? '#1a1a1a' : '#f5f0e8',
          fontWeight: 700, fontSize: 'clamp(0.75rem, 1.5vw, 0.95rem)',
          letterSpacing: '4px', transition: 'color 0.3s', whiteSpace: 'nowrap',
        }}>★ AGENCY MART ★</Link>

        {/* Category links — hidden on small screens */}
        <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 28px)', alignItems: 'center' }}>
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/category/${c.id}`}
              style={{
                textDecoration: 'none', fontSize: '0.58rem', letterSpacing: '2px',
                color: scrolled || !isHome ? '#1a1a1a' : 'rgba(245,240,232,0.75)',
                transition: 'color 0.2s, opacity 0.2s',
                display: 'none',
              }}
              className="nav-cat-link"
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '')}
            >{c.label}</Link>
          ))}
        </div>

        {/* Cart */}
        <div ref={badgeRef}
          onClick={scrollToCart}
          style={{
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            color: scrolled || !isHome ? '#1a1a1a' : '#f5f0e8',
            transition: 'color 0.3s',
          }}
        >
          <span style={{ fontSize: '0.58rem', letterSpacing: '2px' }}>CART</span>
          <div style={{
            background: scrolled || !isHome ? '#1a1a1a' : '#f5f0e8',
            color: scrolled || !isHome ? '#f5f0e8' : '#1a1a1a',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700, transition: 'all 0.3s',
          }}>{count}</div>
        </div>
      </div>
    </nav>
  )
}
