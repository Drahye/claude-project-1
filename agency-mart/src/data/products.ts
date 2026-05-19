export type Shape = 'box' | 'box_tall' | 'box_wide' | 'can' | 'can_short' | 'hat' | 'bag' | 'shoe' | 'jug' | 'book'
export type CategoryId = 'headwear' | 'footwear' | 'carry' | 'vessels' | 'reading'

export interface Spec { label: string; value: string }
export interface Product {
  id: string; name: string; category: CategoryId; tagline: string; desc: string
  price: number; originalPrice?: number
  color: string; accent: string; secondary?: string
  shape: Shape; sku: string; specs: Spec[]; barcode: string
  isNew?: boolean; isFeatured?: boolean; onSale?: boolean
  rating: number; reviewCount: number
}

export const CATEGORIES: { id: CategoryId; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'headwear', label: 'HEADWEAR', icon: '◉', desc: 'Caps, beanies & bucket hats', color: '#3D405B' },
  { id: 'footwear', label: 'FOOTWEAR', icon: '▷', desc: 'Sneakers, boots & slides', color: '#6B4423' },
  { id: 'carry',    label: 'CARRY',    icon: '◈', desc: 'Totes, backpacks & clutches', color: '#2D6A4F' },
  { id: 'vessels',  label: 'VESSELS',  icon: '◎', desc: 'Mugs, jugs & kettles', color: '#E07A5F' },
  { id: 'reading',  label: 'READING',  icon: '▣', desc: 'Books, zines & publications', color: '#C1121F' },
]

export const PRODUCTS: Product[] = [
  // ── HEADWEAR ────────────────────────────────────────────
  {
    id: 'HAT-001', name: 'THE MINIMALIST CAP™', category: 'headwear',
    tagline: 'Reduced to its finest form.',
    desc: 'Six-panel structured cap in cotton twill. Brass adjustable closure. Tonal embroidery.',
    price: 45, originalPrice: 65, color: '#3D405B', accent: '#F2CC8F',
    shape: 'hat', sku: 'AGM-HAT-001',
    specs: [{ label: 'Material', value: 'Cotton Twill' }, { label: 'Closure', value: 'Brass Buckle' }, { label: 'Panels', value: '6-Panel' }, { label: 'Fit', value: 'Structured' }],
    barcode: '5 90001 10001 0', isFeatured: true, onSale: true, rating: 4.8, reviewCount: 142,
  },
  {
    id: 'HAT-002', name: 'BUCKET LIST™', category: 'headwear',
    tagline: 'Loose. Lived-in. Legendary.',
    desc: 'Unstructured bucket hat in heavyweight 14oz canvas. Six brass grommets. Wide brim.',
    price: 38, color: '#C9B99A', accent: '#3D405B',
    shape: 'hat', sku: 'AGM-HAT-002',
    specs: [{ label: 'Material', value: '14oz Canvas' }, { label: 'Brim', value: '6cm' }, { label: 'Grommets', value: '6 Brass' }, { label: 'Structure', value: 'Unstructured' }],
    barcode: '5 90001 10002 7', isNew: true, rating: 4.5, reviewCount: 87,
  },
  {
    id: 'HAT-003', name: 'THERMAL BEANIE 001™', category: 'headwear',
    tagline: 'Heat retention. Maximised.',
    desc: 'Double-knit merino wool beanie. Deep fold-over cuff. Unisex cut. Zero itch.',
    price: 29, color: '#1B1B2F', accent: '#E94560',
    shape: 'hat', sku: 'AGM-HAT-003',
    specs: [{ label: 'Material', value: 'Merino Wool' }, { label: 'Knit', value: 'Double-Knit' }, { label: 'Cuff', value: 'Deep Fold-Over' }, { label: 'Fit', value: 'Unisex' }],
    barcode: '5 90001 10003 4', rating: 4.9, reviewCount: 203,
  },
  // ── FOOTWEAR ─────────────────────────────────────────────
  {
    id: 'SHOE-001', name: 'COURT CLASSIC MK.1™', category: 'footwear',
    tagline: 'Built for the court. Worn everywhere.',
    desc: 'Premium full-grain leather upper. Vulcanized rubber sole. OrthoLite® insole for daily wear.',
    price: 120, originalPrice: 180, color: '#FFFDF5', accent: '#1a1a1a', secondary: '#E63946',
    shape: 'shoe', sku: 'AGM-SHO-001',
    specs: [{ label: 'Upper', value: 'Full Grain Leather' }, { label: 'Sole', value: 'Vulcanized Rubber' }, { label: 'Insole', value: 'OrthoLite®' }, { label: 'Width', value: 'D / 2E' }],
    barcode: '5 90002 20001 1', isFeatured: true, onSale: true, rating: 4.7, reviewCount: 318,
  },
  {
    id: 'SHOE-002', name: 'TERRAIN BOOT PRO™', category: 'footwear',
    tagline: 'Every surface. No excuses.',
    desc: 'Waterproof suede boot. Vibram® Megagrip outsole. 200g Thinsulate™ insulation.',
    price: 155, color: '#6B4423', accent: '#D4A96A',
    shape: 'shoe', sku: 'AGM-SHO-002',
    specs: [{ label: 'Upper', value: 'Waterproof Suede' }, { label: 'Sole', value: 'Vibram® Megagrip' }, { label: 'Insulation', value: '200g Thinsulate™' }, { label: 'Shaft', value: '6 Inch' }],
    barcode: '5 90002 20002 8', isFeatured: true, rating: 4.6, reviewCount: 156,
  },
  {
    id: 'SHOE-003', name: 'URBAN SLIDE RX™', category: 'footwear',
    tagline: 'Recovery. Redefined.',
    desc: 'Contoured EVA foam footbed. Single adjustable strap. Anti-slip carbon rubber outsole.',
    price: 55, color: '#2EC4B6', accent: '#fff',
    shape: 'shoe', sku: 'AGM-SHO-003',
    specs: [{ label: 'Footbed', value: 'Contoured EVA' }, { label: 'Strap', value: 'Single Adjustable' }, { label: 'Outsole', value: 'Carbon Rubber' }, { label: 'Weight', value: '180g' }],
    barcode: '5 90002 20003 5', isNew: true, rating: 4.3, reviewCount: 74,
  },
  // ── CARRY ────────────────────────────────────────────────
  {
    id: 'BAG-001', name: 'TOTE ECONOMY™', category: 'carry',
    tagline: 'Carry more. Apologise less.',
    desc: 'Heavy-duty 18oz cotton canvas. Reinforced PU base. Rolled leather handles.',
    price: 75, color: '#2D6A4F', accent: '#D8F3DC',
    shape: 'bag', sku: 'AGM-BAG-001',
    specs: [{ label: 'Material', value: '18oz Canvas' }, { label: 'Capacity', value: '28L' }, { label: 'Base', value: 'Reinforced PU' }, { label: 'Handles', value: 'Rolled Leather' }],
    barcode: '5 90003 30001 2', isFeatured: true, rating: 4.8, reviewCount: 221,
  },
  {
    id: 'BAG-002', name: 'GRID BACKPACK™', category: 'carry',
    tagline: 'Everything in its place.',
    desc: 'Structured 20L daypack. MOLLE webbing. 15" padded laptop sleeve. 7 pockets.',
    price: 125, originalPrice: 160, color: '#1A1A2E', accent: '#E94560',
    shape: 'bag', sku: 'AGM-BAG-002',
    specs: [{ label: 'Capacity', value: '20L' }, { label: 'Laptop', value: '15" Padded' }, { label: 'System', value: 'MOLLE Webbing' }, { label: 'Pockets', value: '7 Total' }],
    barcode: '5 90003 30002 9', onSale: true, rating: 4.5, reviewCount: 167,
  },
  {
    id: 'BAG-003', name: 'MICRO CLUTCH™', category: 'carry',
    tagline: 'Minimal carry. Maximum presence.',
    desc: 'Pebble-grain vegan leather clutch. 6 card slots. Detachable braided wrist strap.',
    price: 45, color: '#BC6C25', accent: '#FEFAE0',
    shape: 'bag', sku: 'AGM-BAG-003',
    specs: [{ label: 'Material', value: 'Pebble Vegan' }, { label: 'Cards', value: '6 Slots' }, { label: 'Capacity', value: '3L' }, { label: 'Strap', value: 'Braided Detach.' }],
    barcode: '5 90003 30003 6', isNew: true, rating: 4.4, reviewCount: 93,
  },
  // ── VESSELS ──────────────────────────────────────────────
  {
    id: 'JUG-001', name: 'THERMAL VESSEL 32™', category: 'vessels',
    tagline: 'Hot stays hot. Cold stays cold.',
    desc: 'Double-wall vacuum insulated. 32oz. Matte 18/8 stainless steel. Leak-proof lid.',
    price: 35, color: '#E07A5F', accent: '#fff',
    shape: 'jug', sku: 'AGM-JUG-001',
    specs: [{ label: 'Capacity', value: '32oz / 946ml' }, { label: 'Material', value: '18/8 Stainless' }, { label: 'Insulation', value: 'Double-Wall Vac' }, { label: 'BPA Free', value: 'Yes' }],
    barcode: '5 90004 40001 3', isFeatured: true, rating: 4.9, reviewCount: 412,
  },
  {
    id: 'JUG-002', name: 'POUR OVER POT™', category: 'vessels',
    tagline: 'Precision pour. Every time.',
    desc: 'Gooseneck stainless kettle. 600ml. Integrated thermometer. Weighted base.',
    price: 55, color: '#2F2F2F', accent: '#C9AE5D',
    shape: 'jug', sku: 'AGM-JUG-002',
    specs: [{ label: 'Capacity', value: '600ml' }, { label: 'Material', value: 'SS 304' }, { label: 'Spout', value: 'Gooseneck' }, { label: 'Thermometer', value: 'Built-In' }],
    barcode: '5 90004 40002 0', isNew: true, rating: 4.7, reviewCount: 134,
  },
  {
    id: 'JUG-003', name: 'CERAMIC CURVE™', category: 'vessels',
    tagline: 'Thrown by hand. Used daily.',
    desc: 'Hand-thrown stoneware jug. 1L. Lead-free food-safe glaze. Each one unique.',
    price: 28, originalPrice: 40, color: '#8B9467', accent: '#F5F0E8',
    shape: 'jug', sku: 'AGM-JUG-003',
    specs: [{ label: 'Material', value: 'Stoneware' }, { label: 'Capacity', value: '1L' }, { label: 'Glaze', value: 'Lead-Free' }, { label: 'Process', value: 'Hand-Thrown' }],
    barcode: '5 90004 40003 7', onSale: true, rating: 4.6, reviewCount: 88,
  },
  // ── READING ──────────────────────────────────────────────
  {
    id: 'BOOK-001', name: 'THE BRUTALIST COOKBOOK™', category: 'reading',
    tagline: 'Recipes as uncompromising as the architecture.',
    desc: 'Hardcover. 280pp. Photography by K. Adesanya. First edition. Cloth spine.',
    price: 32, color: '#C1121F', accent: '#fff',
    shape: 'book', sku: 'AGM-BK-001',
    specs: [{ label: 'Pages', value: '280' }, { label: 'Binding', value: 'Hardcover' }, { label: 'Edition', value: 'First' }, { label: 'ISBN', value: '978-0-0001-0' }],
    barcode: '5 90005 50001 4', isFeatured: true, rating: 4.8, reviewCount: 267,
  },
  {
    id: 'BOOK-002', name: 'GRID SYSTEMS VOL.1™', category: 'reading',
    tagline: 'The geometry of perfect design.',
    desc: 'Softcover deep-dive into typographic grid systems. 192pp. Limited print run of 2,000.',
    price: 48, color: '#023E8A', accent: '#CAF0F8',
    shape: 'book', sku: 'AGM-BK-002',
    specs: [{ label: 'Pages', value: '192' }, { label: 'Binding', value: 'Softcover' }, { label: 'Print Run', value: '2,000 Only' }, { label: 'ISBN', value: '978-0-0002-7' }],
    barcode: '5 90005 50002 1', isNew: true, rating: 4.9, reviewCount: 189,
  },
  {
    id: 'BOOK-003', name: 'RECEIPT PHILOSOPHY™', category: 'reading',
    tagline: 'Transactions as a form of literature.',
    desc: 'Zine format. 96pp risograph printed. Musings on commerce, desire & retail theory.',
    price: 24, originalPrice: 35, color: '#240046', accent: '#E0AAFF',
    shape: 'book', sku: 'AGM-BK-003',
    specs: [{ label: 'Pages', value: '96' }, { label: 'Format', value: 'Risograph Zine' }, { label: 'Subject', value: 'Retail Theory' }, { label: 'ISBN', value: '978-0-0003-4' }],
    barcode: '5 90005 50003 8', onSale: true, rating: 4.5, reviewCount: 112,
  },
]
