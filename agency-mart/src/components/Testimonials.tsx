const REVIEWS = [
  { name: 'AMARA O.', id: 'TXN-2024-4521', item: 'THE MINIMALIST CAP™', rating: 5, date: '04/12/2024', text: 'Arrived in 2 days, packed like a gift. The brass closure is worth the price alone. Wearing it daily.' },
  { name: 'JAMES K.', id: 'TXN-2024-6688', item: 'TERRAIN BOOT PRO™', rating: 5, date: '03/28/2024', text: 'Hiked 12 miles in the rain. Feet stayed dry. The Vibram sole grips like nothing I\'ve tried before.' },
  { name: 'SOFIA M.', id: 'TXN-2024-3310', item: 'TOTE ECONOMY™', rating: 5, date: '04/01/2024', text: 'I carry my laptop, gym kit and groceries in this thing. It hasn\'t flinched once. The canvas is incredible.' },
  { name: 'DEVIN T.', id: 'TXN-2024-7742', item: 'THERMAL VESSEL 32™', rating: 5, date: '04/18/2024', text: 'Still hot at 9pm. Coffee went in at 7am. That\'s not a bottle, that\'s a miracle.' },
  { name: 'PRIYA R.', id: 'TXN-2024-1190', item: 'THE BRUTALIST COOKBOOK™', rating: 4, date: '03/15/2024', text: 'Photography is stunning. Every recipe is a conversation starter. I gift this to everyone.' },
  { name: 'LEON B.', id: 'TXN-2024-5503', item: 'GRID BACKPACK™', rating: 5, date: '04/08/2024', text: 'Obsessively organized with 7 pockets. The MOLLE webbing takes my camera clips perfectly.' },
]

function Stars({ n }: { n: number }) {
  return <span style={{ fontSize: '0.75rem', letterSpacing: '3px', color: '#b8860b' }}>{'★'.repeat(n)}</span>
}

export default function Testimonials() {
  return (
    <section style={{ padding: '60px 24px', background: 'var(--paper)', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 40, fontFamily: 'Space Mono, monospace' }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '5px', opacity: 0.45 }}>VERIFIED PURCHASES</div>
          <div style={{ fontSize: 'clamp(1rem,2.5vw,1.5rem)', fontWeight: 700, letterSpacing: '6px', marginTop: 6 }}>CUSTOMER RECEIPTS</div>
          <div style={{ fontSize: '0.58rem', letterSpacing: '3px', opacity: 0.45, marginTop: 6 }}>REAL ORDERS · REAL PEOPLE · REAL OPINIONS</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {REVIEWS.map((r) => (
            <div key={r.id} style={{
              background: '#fff', padding: '22px 20px',
              fontFamily: 'Space Mono, monospace',
              boxShadow: '2px 2px 0 rgba(26,26,26,0.08)',
              border: '1px solid rgba(26,26,26,0.12)',
              position: 'relative',
            }}>
              {/* Receipt tear top */}
              <div style={{ position: 'absolute', top: -6, left: 0, right: 0, height: 12, overflow: 'hidden' }}>
                <svg width="100%" height="12" preserveAspectRatio="none">
                  <path d={Array.from({ length: 30 }, (_, i) => `${i === 0 ? 'M' : 'L'}${i * (100 / 29)}%,${i % 2 === 0 ? 0 : 12}`).join(' ')} fill="#fff" stroke="rgba(26,26,26,0.1)" strokeWidth="0.5" />
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px' }}>{r.name}</div>
                  <div style={{ fontSize: '0.52rem', opacity: 0.45, letterSpacing: '1.5px', marginTop: 2 }}>{r.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Stars n={r.rating} />
                  <div style={{ fontSize: '0.5rem', opacity: 0.4, letterSpacing: '1.5px', marginTop: 2 }}>{r.date}</div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed rgba(26,26,26,0.2)', margin: '8px 0' }} />

              <div style={{ fontSize: '0.65rem', lineHeight: 1.8, opacity: 0.75, letterSpacing: '0.3px', fontStyle: 'italic' }}>
                "{r.text}"
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed rgba(26,26,26,0.2)', margin: '10px 0 6px' }} />

              <div style={{ fontSize: '0.52rem', opacity: 0.45, letterSpacing: '2px' }}>
                ITEM: {r.item}
              </div>
              <div style={{ fontSize: '0.5rem', opacity: 0.35, letterSpacing: '2px', marginTop: 2 }}>
                ✓ VERIFIED PURCHASE
              </div>
            </div>
          ))}
        </div>

        {/* Aggregate stats */}
        <div style={{
          marginTop: 40, padding: '24px', background: '#fff',
          display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 6vw, 80px)',
          flexWrap: 'wrap', fontFamily: 'Space Mono, monospace',
          border: '1px dashed rgba(26,26,26,0.2)',
        }}>
          {[['★★★★★', '4.7 AVERAGE RATING'], ['2,400+', 'HAPPY CUSTOMERS'], ['98%', 'WOULD RECOMMEND']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(1rem,2vw,1.4rem)', fontWeight: 700, letterSpacing: '2px', color: '#b8860b' }}>{v}</div>
              <div style={{ fontSize: '0.55rem', letterSpacing: '3px', opacity: 0.5, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
