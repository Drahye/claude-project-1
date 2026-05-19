import * as THREE from 'three'
import type { Product } from '../data/products'
import { buildProductMesh } from './threeUtils'

// ONE WebGL context for all product cards / tiles.
// Each card registers a scene; the shared loop renders each scene into an
// offscreen buffer and copies it to the card's 2D canvas via drawImage().

interface CardEntry {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  mesh: THREE.Object3D
  canvas: HTMLCanvasElement   // 2D display canvas
  t: number
  hovered: boolean
  visible: boolean
}

class SharedProductRenderer {
  private offscreen: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private cards = new Map<string, CardEntry>()
  private raf = 0
  private started = false

  constructor() {
    this.offscreen = document.createElement('canvas')
    this.offscreen.width = 400
    this.offscreen.height = 300
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.offscreen,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,  // needed for drawImage() reads
    })
    this.renderer.setClearColor(0xfaf9f6, 1)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  register(product: Product, canvas: HTMLCanvasElement): THREE.Object3D {
    const scene = new THREE.Scene()
    const w = Math.max(canvas.offsetWidth, 240)
    const h = 240
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50)
    camera.position.set(0, 0.4, 5.5)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const d = new THREE.DirectionalLight(0xffffff, 0.85)
    d.position.set(3, 5, 4); d.castShadow = true; scene.add(d)
    const accent = new THREE.PointLight(new THREE.Color(product.color), 0.4, 12)
    accent.position.set(-2, 2, 2); scene.add(accent)
    const back = new THREE.PointLight(0xfff0e0, 0.2, 10)
    back.position.set(0, 3, -3); scene.add(back)

    const mesh = buildProductMesh(product, 1.2)
    scene.add(mesh)

    // Set canvas 2D dimensions
    canvas.width = w
    canvas.height = h

    this.cards.set(product.id, {
      scene, camera, mesh, canvas,
      t: Math.random() * Math.PI * 2,
      hovered: false,
      visible: true,
    })

    if (!this.started) this.start()
    return mesh
  }

  unregister(id: string) {
    const card = this.cards.get(id)
    if (card) {
      // Dispose geometries/materials
      card.scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach(m => { if ((m as THREE.MeshPhongMaterial).map) (m as THREE.MeshPhongMaterial).map!.dispose(); m.dispose() })
        }
      })
      this.cards.delete(id)
    }
    if (this.cards.size === 0) this.stop()
  }

  setHovered(id: string, v: boolean) {
    const c = this.cards.get(id)
    if (c) c.hovered = v
  }

  setVisible(id: string, v: boolean) {
    const c = this.cards.get(id)
    if (c) c.visible = v
  }

  getMesh(id: string): THREE.Object3D | null {
    return this.cards.get(id)?.mesh ?? null
  }

  private start() {
    this.started = true
    const loop = () => {
      this.raf = requestAnimationFrame(loop)
      this.cards.forEach((card, id) => {
        if (!card.visible) return

        card.t += 0.012
        if (!card.hovered) card.mesh.rotation.y += 0.008
        card.mesh.position.y = Math.sin(card.t) * 0.055

        const w = Math.max(card.canvas.offsetWidth || card.canvas.width, 240)
        const h = 240
        if (card.canvas.width !== w) card.canvas.width = w

        this.renderer.setSize(w, h, false)
        card.camera.aspect = w / h
        card.camera.updateProjectionMatrix()
        this.renderer.render(card.scene, card.camera)

        const ctx = card.canvas.getContext('2d')
        if (ctx) ctx.drawImage(this.offscreen, 0, 0, w, h)
      })
    }
    loop()
  }

  private stop() {
    this.started = false
    cancelAnimationFrame(this.raf)
  }
}

// Lazy singleton
let _instance: SharedProductRenderer | null = null
export function getSharedRenderer(): SharedProductRenderer {
  if (!_instance) _instance = new SharedProductRenderer()
  return _instance
}
