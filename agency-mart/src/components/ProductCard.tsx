import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import type { Product } from '../data/products'
import { drawBarcodeCanvas } from '../lib/threeUtils'
import { getSharedRenderer } from '../lib/sharedRenderer'
import { useCart } from '../context/CartContext'

// ── PRODUCT CANVAS — single shared WebGL renderer ────────
function ProductCanvas({ product }: { product: Product }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const meshRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const tid = setTimeout(() => {
      const mesh = getSharedRenderer().register(product, canvas)
      meshRef.current = mesh
      const obs = new IntersectionObserver(
        ([e]) => getSharedRenderer().setVisible(product.id, e.isIntersecting),
        { threshold: 0.05 }
      )
      obs.observe(canvas)
    }, 20)
    return () => {
      clearTimeout(tid)
      getSharedRenderer().unregister(product.id)
    }
  }, [product])

  const onEnter = useCallback(() => {
    getSharedRenderer().setHovered(product.id, true)
    const mesh = meshRef.current
    if (mesh) {
      gsap.to(mesh.rotation, { y: mesh.rotation.y + Math.PI * 2, duration: 1.3, ease: 'power2.inOut' })
      gsap.to(mesh.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.35, ease: 'back.out(1.7)' })
    }
  }, [product.id])

  const onLeave = useCallback(() => {
    getSharedRenderer().setHovered(product.id, false)
    const mesh = meshRef.current
    if (mesh) gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.28 })
  }, [product.id])

  return (
    <div style={{ width: '100%', height: 240, background: '#faf9f6', overflow: 'hidden' }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 240 }} />
    </div>
  )
}

// ── STARS ─────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: '0.65rem', letterSpacing: '2px', color: '#b8860b' }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────
export default function ProductCard({ product, showBadge = true }: { product: Product; showBadge?: boolean }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const barcodeRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barcodeRef.current) setTimeout(() => drawBarcodeCanvas(barcodeRef.current!), 100)
  }, [])

  const handleAdd = () => {
    add(product); setAdded(true); setTimeout(() => setAdded(false), 1600)
    if (cardRef.current) gsap.fromTo(cardRef.current, { y: -3 }, { y: 0, duration: 0.3, ease: 'bounce.out' })
  }

  const savings = product.originalPrice ? product.originalPrice - product.price : 0

  return (
    <div ref={cardRef} className="product-card">
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <div className="price-tag">${product.price.toLocaleString()}</div>
        {product.originalPrice && (
          <div style={{ background: '#C1121F', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '2px', padding: '3px 7px' }}>
            SAVE ${savings}
          </div>
        )}
      </div>

      {showBadge && product.isNew && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, background: '#1a1a1a', color: '#f5f0e8', fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '2px', padding: '3px 8px' }}>NEW</div>
      )}
      {showBadge && product.onSale && !product.isNew && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, background: '#C1121F', color: '#fff', fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '2px', padding: '3px 8px' }}>SALE</div>
      )}

      <ProductCanvas product={product} />

      <div style={{ padding: '12px 13px 0', fontFamily: 'Space Mono, monospace' }}>
        <div style={{ fontSize: '0.55rem', letterSpacing: '2px', opacity: 0.48 }}>{product.sku} · {product.category.toUpperCase()}</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, letterSpacing: '1.5px', margin: '4px 0 2px', lineHeight: 1.2 }}>{product.name}</div>
        <div style={{ fontSize: '0.63rem', opacity: 0.62, lineHeight: 1.65, letterSpacing: '0.3px', marginBottom: 6 }}>{product.desc}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Stars rating={product.rating} />
          <span style={{ fontSize: '0.55rem', opacity: 0.5, fontFamily: 'Space Mono, monospace', letterSpacing: '1px' }}>({product.reviewCount})</span>
        </div>

        {product.originalPrice && (
          <div style={{ fontSize: '0.7rem', letterSpacing: '1px', marginBottom: 8 }}>
            <span style={{ textDecoration: 'line-through', opacity: 0.45 }}>${product.originalPrice}</span>
            <span style={{ color: '#C1121F', fontWeight: 700, marginLeft: 8 }}>${product.price}</span>
          </div>
        )}

        <div className="nutrition-table">
          <div className="nutrition-header">PRODUCT SPECS</div>
          <div className="nutrition-row thick">
            <span style={{ fontWeight: 700, fontSize: '0.64rem' }}>Category</span>
            <span style={{ fontWeight: 700 }}>{product.category.toUpperCase()}</span>
          </div>
          {product.specs.map(s => (
            <div key={s.label} className="nutrition-row">
              <span>{s.label}</span>
              <span style={{ fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <canvas ref={barcodeRef} style={{ width: '100%', height: 40 }} />
          <div style={{ fontSize: '0.5rem', letterSpacing: '3px' }}>{product.barcode}</div>
        </div>
      </div>

      <div style={{ padding: '9px 13px 13px' }}>
        <button className={`btn-ink${added ? ' added' : ''}`} onClick={handleAdd}>
          {added ? '[ ✓  IN CART ]' : '[ +  ADD TO CART ]'}
        </button>
      </div>
    </div>
  )
}
