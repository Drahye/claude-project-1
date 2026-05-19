import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { PRODUCTS } from '../data/products'
import { buildProductMesh } from '../lib/threeUtils'

// Immersive hero: products on elevated platform, cinematic camera orbit, dramatic 3-point lighting
export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d0d0d)
    scene.fog = new THREE.FogExp2(0x0d0d0d, 0.065)

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80)
    camera.position.set(0, 1.8, 11)
    camera.lookAt(0, 0.5, 0)

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()

    // ── LIGHTING ──────────────────────────────────────────
    // Key light — warm, upper right
    const key = new THREE.SpotLight(0xfff5e0, 3.5, 28, Math.PI / 5, 0.4, 1.5)
    key.position.set(5, 10, 6); key.castShadow = true
    key.shadow.mapSize.setScalar(2048); key.shadow.bias = -0.001
    scene.add(key); scene.add(key.target)

    // Fill light — cool blue, left
    const fill = new THREE.PointLight(0xc8e0ff, 1.2, 22)
    fill.position.set(-7, 4, 3); scene.add(fill)

    // Rim light — product backlighting
    const rim = new THREE.SpotLight(0xffe0c0, 2.2, 20, Math.PI / 4, 0.6)
    rim.position.set(0, 6, -8); rim.target.position.set(0, 0, 0)
    scene.add(rim); scene.add(rim.target)

    // Ambient
    scene.add(new THREE.AmbientLight(0x202030, 2.0))

    // ── FLOOR ─────────────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(40, 40)
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 60 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.1; floor.receiveShadow = true
    scene.add(floor)

    // Grid lines on floor
    const grid = new THREE.GridHelper(36, 36, 0x222222, 0x1a1a1a)
    grid.position.y = -2.09; scene.add(grid)

    // ── PLATFORM RINGS ────────────────────────────────────
    const ringMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a, shininess: 80 })
    ;[2.2, 4.0, 5.8].forEach(r => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 6, 64), ringMat)
      ring.rotation.x = -Math.PI / 2; ring.position.y = -2.08; scene.add(ring)
    })

    // ── PRODUCTS IN DRAMATIC FORMATION ────────────────────
    // Pick a mix of products for hero showcase
    const heroProductIds = ['HAT-001', 'SHOE-001', 'BAG-001', 'JUG-001', 'BOOK-001', 'HAT-002', 'SHOE-002', 'BAG-002']
    const heroProducts = heroProductIds.map(id => PRODUCTS.find(p => p.id === id)!).filter(Boolean)

    type HeroItem = { obj: THREE.Object3D; baseY: number; phase: number; angle: number; radius: number }
    const items: HeroItem[] = []

    heroProducts.forEach((p, i) => {
      const mesh = buildProductMesh(p, i === 0 ? 1.6 : 1.1) // center product larger

      const isFront = i === 0
      const angle = isFront ? 0 : ((i - 1) / (heroProducts.length - 1)) * Math.PI * 2
      const radius = isFront ? 0 : 4.2

      mesh.position.set(
        isFront ? 0 : Math.cos(angle) * radius,
        isFront ? 0.4 : Math.sin(i * 0.7) * 0.3 - 0.2,
        isFront ? 0 : Math.sin(angle) * radius * 0.7
      )
      mesh.rotation.y = isFront ? 0.4 : -angle + Math.PI * 0.6

      // Per-product color glow from below
      const glow = new THREE.PointLight(new THREE.Color(p.color), isFront ? 0.8 : 0.4, 4)
      glow.position.copy(mesh.position); glow.position.y -= 0.8
      scene.add(glow)

      scene.add(mesh)
      items.push({ obj: mesh, baseY: mesh.position.y, phase: i * (Math.PI * 2 / heroProducts.length), angle, radius })
    })

    // ── FLOATING PARTICLES ────────────────────────────────
    const particleGeo = new THREE.BufferGeometry()
    const pCount = 120
    const pPos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 20
      pPos[i * 3 + 1] = Math.random() * 8 - 2
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 14
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({ color: 0x888888, size: 0.03, sizeAttenuation: true })
    )
    scene.add(particles)

    // ── MOUSE ─────────────────────────────────────────────
    let mx = 0, my = 0
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize', resize)

    // ── GSAP INTRO ANIMATION ─────────────────────────────
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current.querySelectorAll('.hero-line'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
      )
    }

    // ── ANIMATE ───────────────────────────────────────────
    let t = 0, orbitAngle = 0, raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      t += 0.008; orbitAngle += 0.0012

      items.forEach((it, i) => {
        it.obj.rotation.y += i === 0 ? 0.006 : 0.005
        it.obj.position.y = it.baseY + Math.sin(t + it.phase) * 0.14
      })

      // Particles drift up slowly
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pCount; i++) {
        posAttr.setY(i, posAttr.getY(i) + 0.003)
        if (posAttr.getY(i) > 6) posAttr.setY(i, -2)
      }
      posAttr.needsUpdate = true

      // Camera orbits slowly with mouse parallax
      const cx = Math.sin(orbitAngle) * 2.5 + mx * 1.2
      const cz = 11 + Math.cos(orbitAngle) * 2.5
      camera.position.x += (cx - camera.position.x) * 0.015
      camera.position.z += (cz - camera.position.z) * 0.015
      camera.position.y += (1.8 + my * -0.8 - camera.position.y) * 0.015
      camera.lookAt(0, 0.5, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    }
  }, [])

  const scrollToProducts = () => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Overlay */}
      <div ref={overlayRef} style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 2,
      }}>
        {/* Top badge */}
        <div className="hero-line" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '6px', color: 'rgba(245,240,232,0.5)', marginBottom: 18 }}>
          EST. 2024 ◆ FREE SHIPPING OVER $100 ◆ RETURNS ACCEPTED
        </div>

        {/* Main title */}
        <div className="hero-line" style={{
          fontFamily: 'Space Mono, monospace', fontWeight: 700,
          fontSize: 'clamp(2.5rem, 8vw, 6rem)',
          letterSpacing: 'clamp(4px, 1.5vw, 16px)',
          color: '#f5f0e8', lineHeight: 0.95,
          textAlign: 'center',
          textShadow: '0 0 40px rgba(0,0,0,0.8)',
        }}>★ AGENCY MART ★</div>

        {/* Tagline */}
        <div className="hero-line" style={{
          fontFamily: 'Space Mono, monospace', fontSize: 'clamp(0.7rem, 1.8vw, 1rem)',
          letterSpacing: 'clamp(3px, 1vw, 8px)', color: 'rgba(245,240,232,0.65)',
          marginTop: 18, textAlign: 'center',
        }}>
          HATS · SHOES · BAGS · VESSELS · BOOKS
        </div>

        {/* Stats row */}
        <div className="hero-line" style={{
          display: 'flex', gap: 'clamp(20px, 4vw, 48px)', marginTop: 32,
          fontFamily: 'Space Mono, monospace',
        }}>
          {[['2,400+', 'ORDERS SHIPPED'], ['15', 'PRODUCTS'], ['★★★★★', 'RATED']].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.6rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '2px' }}>{val}</div>
              <div style={{ fontSize: '0.52rem', letterSpacing: '3px', color: 'rgba(245,240,232,0.45)', marginTop: 3 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="hero-line" style={{ display: 'flex', gap: 14, marginTop: 36, pointerEvents: 'all' }}>
          <button
            onClick={scrollToProducts}
            style={{
              fontFamily: 'Space Mono, monospace', fontSize: '0.68rem', letterSpacing: '4px',
              background: '#f5f0e8', color: '#1a1a1a', border: 'none', padding: '13px 28px',
              cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = '#fff'; (e.target as HTMLButtonElement).style.letterSpacing = '5px' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = '#f5f0e8'; (e.target as HTMLButtonElement).style.letterSpacing = '4px' }}
          >[ SHOP NOW ]</button>
          <button
            onClick={() => document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              fontFamily: 'Space Mono, monospace', fontSize: '0.68rem', letterSpacing: '4px',
              background: 'transparent', color: '#f5f0e8',
              border: '1px solid rgba(245,240,232,0.4)', padding: '13px 28px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#f5f0e8' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(245,240,232,0.4)' }}
          >[ VIEW CATEGORIES ]</button>
        </div>

        {/* Scroll indicator */}
        <div className="blink hero-line" style={{
          position: 'absolute', bottom: 28,
          fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '4px',
          color: 'rgba(245,240,232,0.35)',
        }}>▼ SCROLL TO BROWSE ▼</div>
      </div>

      {/* Bottom gradient fade to paper */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to bottom, transparent, #f5f0e8)',
        pointerEvents: 'none', zIndex: 3,
      }} />
    </div>
  )
}
