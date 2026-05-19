import * as THREE from 'three'
import type { Product } from '../data/products'

// ── BARCODE CANVAS ────────────────────────────────────────
export function drawBarcodeCanvas(canvas: HTMLCanvasElement) {
  const w = canvas.offsetWidth || 240
  canvas.width = w; canvas.height = 44
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, 44)
  ctx.fillStyle = '#1a1a1a'
  let x = 4
  while (x < w - 4) {
    const bw = Math.random() > 0.58 ? 3 : 2
    ctx.fillRect(x, 0, bw, 36)
    x += bw + (Math.random() > 0.4 ? 2 : 1)
  }
}

// ── LABEL TEXTURE FOR BOX/CAN PRODUCTS ───────────────────
function makeLabel(p: Product, size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = size; c.height = size
  const ctx = c.getContext('2d')!

  ctx.fillStyle = p.color; ctx.fillRect(0, 0, size, size)
  const g = ctx.createLinearGradient(0, 0, 0, size)
  g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.2)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = p.accent; ctx.globalAlpha = 0.9
  ctx.fillRect(0, 0, size, 86); ctx.fillRect(0, size - 86, size, 86)
  ctx.globalAlpha = 1

  ctx.fillStyle = p.color; ctx.font = 'bold 18px "Courier New"'; ctx.textAlign = 'center'
  ctx.fillText('★  AGENCY MART  ★', size / 2, 50)

  ctx.fillStyle = p.accent; ctx.font = 'bold 52px "Courier New"'
  const nm = p.name.replace('™', '')
  ctx.fillText(nm, size / 2, 162)
  ctx.font = 'bold 26px "Courier New"'; ctx.fillText('™', size / 2 + ctx.measureText(nm).width / 2 + 2, 138)

  ctx.font = '18px "Courier New"'; ctx.globalAlpha = 0.78
  ctx.fillText(p.tagline.toUpperCase(), size / 2, 200)
  ctx.globalAlpha = 1

  ctx.font = '13px "Courier New"'; ctx.globalAlpha = 0.68
  const words = p.desc.split(' '); let line = '', y = 256
  words.forEach(w => {
    const t = line + w + ' '
    if (ctx.measureText(t).width > 440 && line) { ctx.fillText(line.trim(), size / 2, y); y += 20; line = w + ' ' }
    else { line = t }
  }); ctx.fillText(line.trim(), size / 2, y); ctx.globalAlpha = 1

  // price bubble
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(size - 68, 295, 38, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 16px "Courier New"'; ctx.textAlign = 'center'
  ctx.fillText('$' + p.price.toLocaleString(), size - 68, 299)

  // barcode
  ctx.fillStyle = '#fff'; ctx.fillRect(94, 355, 324, 54)
  ctx.fillStyle = '#1a1a1a'
  for (let b = 0; b < 72; b++) { const bw = Math.random() > 0.55 ? 3 : 2; ctx.fillRect(100 + b * 4.3, 359, bw, 40) }
  ctx.font = '12px "Courier New"'; ctx.textAlign = 'center'
  ctx.fillText(p.barcode, size / 2, 428); ctx.fillText(p.sku, size / 2, 445)

  return new THREE.CanvasTexture(c)
}

// ── MATERIAL HELPERS ──────────────────────────────────────
const mat = (color: string, shine = 40) => new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: shine })
const texMat = (tex: THREE.CanvasTexture, shine = 80) => new THREE.MeshPhongMaterial({ map: tex, shininess: shine })

// ── SHAPE BUILDERS ────────────────────────────────────────
function hat(p: Product, sc: number): THREE.Group {
  const g = new THREE.Group()
  const brimM = mat(p.color, 30)
  const crownM = mat(p.color, 40)
  const bandM = mat(p.accent, 70)
  g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(1.3 * sc, 1.3 * sc, 0.09 * sc, 48), brimM)))
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.62 * sc, 0.7 * sc, 1.05 * sc, 48), crownM)
  crown.position.y = 0.57 * sc; g.add(crown)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.715 * sc, 0.715 * sc, 0.13 * sc, 48), bandM)
  band.position.y = 0.065 * sc; g.add(band)
  g.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true })
  return g
}

function bag(p: Product, sc: number): THREE.Group {
  const g = new THREE.Group()
  const bodyM = mat(p.color, 45)
  const accentM = mat(p.accent, 30)
  const goldM = mat('#C9A84C', 100)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4 * sc, 1.2 * sc, 0.55 * sc), bodyM)
  g.add(body)
  // gusset
  const gusset = new THREE.Mesh(new THREE.BoxGeometry(1.38 * sc, 0.06 * sc, 0.55 * sc), accentM)
  gusset.position.y = -0.57 * sc; g.add(gusset)
  // handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.38 * sc, 0.055 * sc, 8, 20), bodyM)
  handle.rotation.x = Math.PI / 2; handle.position.y = 0.73 * sc; g.add(handle)
  // clasp
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.22 * sc, 0.14 * sc, 0.1 * sc), goldM)
  clasp.position.set(0, 0.08 * sc, 0.3 * sc); g.add(clasp)
  g.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true })
  return g
}

function shoe(p: Product, sc: number): THREE.Group {
  const g = new THREE.Group()
  const soleM = mat('#f0ece0', 20)
  const upperM = mat(p.color, 55)
  const accentM = mat(p.accent === '#fff' ? '#e8e0d0' : p.accent, 30)
  // sole
  const sole = new THREE.Mesh(new THREE.BoxGeometry(1.72 * sc, 0.18 * sc, 0.75 * sc), soleM)
  sole.position.y = -0.52 * sc; g.add(sole)
  // midsole stripe
  if (p.secondary) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.72 * sc, 0.06 * sc, 0.76 * sc), mat(p.secondary, 50))
    stripe.position.y = -0.38 * sc; g.add(stripe)
  }
  // upper
  const upper = new THREE.Mesh(new THREE.BoxGeometry(1.5 * sc, 0.52 * sc, 0.7 * sc), upperM)
  upper.position.y = -0.1 * sc; g.add(upper)
  // toe cap
  const toeGeo = new THREE.SphereGeometry(0.34 * sc, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const toe = new THREE.Mesh(toeGeo, accentM)
  toe.rotation.z = Math.PI / 2; toe.position.set(0.72 * sc, -0.28 * sc, 0); g.add(toe)
  // tongue
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.44 * sc, 0.38 * sc, 0.04 * sc), accentM)
  tongue.position.set(0, 0.14 * sc, 0.37 * sc); g.add(tongue)
  g.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true })
  return g
}

function jug(p: Product, sc: number): THREE.Group {
  const g = new THREE.Group()
  const bodyM = mat(p.color, 55)
  const accentM = mat(p.accent === '#fff' ? '#e8e0d0' : p.accent, 80)
  // body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.52 * sc, 0.68 * sc, 1.4 * sc, 36), bodyM)
  g.add(body)
  // neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * sc, 0.52 * sc, 0.22 * sc, 36), bodyM)
  neck.position.y = 0.81 * sc; g.add(neck)
  // lip ring
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.27 * sc, 0.03 * sc, 8, 24), accentM)
  lip.position.y = 0.93 * sc; g.add(lip)
  // handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32 * sc, 0.065 * sc, 8, 14, Math.PI), bodyM)
  handle.rotation.y = Math.PI / 2; handle.position.set(0.7 * sc, 0, 0); g.add(handle)
  // label band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.69 * sc, 0.69 * sc, 0.55 * sc, 36), accentM)
  band.position.y = 0.1 * sc; g.add(band)
  // band text via sub-label
  const bandLabel = mat(p.color, 20)
  const bandText = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * sc, 0.7 * sc, 0.54 * sc, 36), bandLabel)
  bandText.position.y = 0.1 * sc
  g.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true })
  return g
}

function book(p: Product, sc: number): THREE.Group {
  const g = new THREE.Group()
  const tex = makeLabel(p)
  const coverFrontM = texMat(tex, 25)
  const coverM = mat(p.color, 25)
  const pagesM = mat('#f5f0e8', 8)
  const spineM = mat(p.color, 40)

  // page block
  const pages = new THREE.Mesh(new THREE.BoxGeometry(1.06 * sc, 1.46 * sc, 0.14 * sc), pagesM)
  pages.position.z = 0.005; g.add(pages)
  // cover
  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(1.12 * sc, 1.52 * sc, 0.18 * sc),
    [coverM, coverM, coverM, coverM, coverFrontM, coverM]
  )
  g.add(cover)
  // spine
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.09 * sc, 1.52 * sc, 0.2 * sc), spineM)
  spine.position.x = -0.505 * sc; g.add(spine)
  g.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = true })
  return g
}

// ── PUBLIC API ────────────────────────────────────────────
export function buildProductMesh(p: Product, scale = 1.35): THREE.Object3D {
  const sc = scale
  switch (p.shape) {
    case 'hat':      return hat(p, sc)
    case 'bag':      return bag(p, sc)
    case 'shoe':     return shoe(p, sc)
    case 'jug':      return jug(p, sc)
    case 'book':     return book(p, sc)
    case 'box_tall': {
      const geo = new THREE.BoxGeometry(0.9 * sc, 1.85 * sc, 0.88 * sc)
      const tex = makeLabel(p)
      const m = new THREE.Mesh(geo, [mat(p.color), mat(p.color), mat(p.color), mat(p.color), texMat(tex), mat(p.color)])
      m.castShadow = true; return m
    }
    case 'box_wide': {
      const geo = new THREE.BoxGeometry(1.65 * sc, 1.0 * sc, 0.78 * sc)
      const tex = makeLabel(p)
      const m = new THREE.Mesh(geo, [mat(p.color), mat(p.color), mat(p.color), mat(p.color), texMat(tex), mat(p.color)])
      m.castShadow = true; return m
    }
    case 'can': {
      const geo = new THREE.CylinderGeometry(0.6 * sc, 0.6 * sc, 1.5 * sc, 40)
      const tex = makeLabel(p)
      const m = new THREE.Mesh(geo, [texMat(tex), mat(p.color), mat(p.color)])
      m.castShadow = true; return m
    }
    case 'can_short': {
      const geo = new THREE.CylinderGeometry(0.72 * sc, 0.72 * sc, 1.0 * sc, 40)
      const tex = makeLabel(p)
      const m = new THREE.Mesh(geo, [texMat(tex), mat(p.color), mat(p.color)])
      m.castShadow = true; return m
    }
    default: {
      const geo = new THREE.BoxGeometry(1.15 * sc, 1.55 * sc, 0.68 * sc)
      const tex = makeLabel(p)
      const m = new THREE.Mesh(geo, [mat(p.color), mat(p.color), mat(p.color), mat(p.color), texMat(tex), mat(p.color)])
      m.castShadow = true; return m
    }
  }
}
