---
name: game-feel
description: Add game-feel to digital products using spring physics, particle effects, screen shake, juice, and delight moments. Use when a UI feels flat or mechanical, when building gamified features, or when you want interactions to feel alive and satisfying.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Game Feel

You are a game feel and interaction delight expert. Your goal is to help teams add the "juice" that makes interactions feel alive, satisfying, and memorable — transforming functional UIs into experiences users enjoy using.

## When to Use

- A UI works but feels mechanical or lifeless
- Building gamified features (streaks, points, achievements, progress)
- Making a key moment more satisfying (completing a task, upgrading, sharing)
- Adding personality to empty states, loading screens, or onboarding
- Creating a product with premium physical feel (Apple-level polish)

---

## What is "Game Feel" / "Juice"?

Game feel is the collection of small exaggerations and responses that make interactions feel physical and rewarding — borrowed from game design:

- **Squash and stretch** — objects deform when they hit or are pressed
- **Anticipation** — slight recoil before an action fires
- **Follow-through** — motion continues briefly past the endpoint
- **Secondary motion** — other elements react to a primary action
- **Screen shake** — camera trembles on impact
- **Particle burst** — visual explosion of color on completion
- **Sound + haptics** — tactile and audio confirmation
- **Overshoot** — spring physics go past the target then settle

---

## Spring Physics (The Foundation)

Springs feel physical. CSS easing curves feel mathematical. Use springs for any interface that needs to feel alive.

### Framer Motion Spring Config
```tsx
import { motion, useSpring, useTransform } from 'framer-motion';

// Spring presets
const springConfigs = {
  snappy: { type: 'spring', stiffness: 400, damping: 25 },
  bouncy: { type: 'spring', stiffness: 300, damping: 15 },
  wobbly: { type: 'spring', stiffness: 180, damping: 10 },
  gentle: { type: 'spring', stiffness: 120, damping: 20 },
  rigid:  { type: 'spring', stiffness: 600, damping: 35 },
};

// Button with spring press
function JuicyButton({ onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={springConfigs.snappy}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
```

### Squash and Stretch
```tsx
function SquashButton({ children, onClick }) {
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      animate={pressed ? { scaleX: 1.15, scaleY: 0.85 } : { scaleX: 1, scaleY: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
```

---

## Particle Effects

### CSS Confetti (Pure CSS, No Library)
```tsx
function ConfettiBurst({ active }: { active: boolean }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#22c55e'][i % 5],
    x: Math.random() * 200 - 100,
    y: -(Math.random() * 200 + 100),
    rotate: Math.random() * 720,
  }));

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{ background: p.color, left: '50%', top: '50%' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
```

### Canvas Particle System (High Performance)
```typescript
class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];

  burst(x: number, y: number, count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: Math.random() * 6 + 2,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      });
    }
    this.animate();
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;  // gravity
      p.life -= p.decay;
      p.vx *= 0.98; // air resistance
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    if (this.particles.length > 0) requestAnimationFrame(() => this.animate());
  }
}
```

---

## Screen Shake

```tsx
import { motion, useAnimation } from 'framer-motion';

function useScreenShake() {
  const controls = useAnimation();

  const shake = async (intensity = 5, duration = 0.4) => {
    await controls.start({
      x: [0, -intensity, intensity, -intensity, intensity, 0],
      y: [0, intensity, -intensity/2, intensity/2, 0],
      transition: { duration, ease: 'easeInOut' },
    });
  };

  return { controls, shake };
}

// Usage
function ErrorForm() {
  const { controls, shake } = useScreenShake();

  const handleSubmit = async () => {
    const isValid = validate();
    if (!isValid) {
      shake(4, 0.3); // shake on error
      sounds.playError();
    }
  };

  return (
    <motion.div animate={controls}>
      <form onSubmit={handleSubmit}>{/* form content */}</form>
    </motion.div>
  );
}
```

---

## Achievement & Reward Moments

### Task Completion
```tsx
function TaskCompleteAnimation({ onComplete }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.3, 1],
        opacity: [0, 1, 1],
      }}
      transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500"
    >
      <motion.div
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <CheckIcon className="w-8 h-8 text-white" />
      </motion.div>
    </motion.div>
  );
}
```

### Streak Counter
```tsx
function StreakBadge({ count }: { count: number }) {
  const prevCount = usePrevious(count);
  const increased = count > (prevCount ?? count);

  return (
    <div className="relative">
      <AnimatePresence>
        {increased && (
          <motion.span
            key={count}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -30, opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center text-orange-500 font-bold"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        key={`count-${count}`}
        animate={increased ? { scale: [1, 1.3, 1] } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="text-2xl font-bold"
      >
        🔥 {count}
      </motion.span>
    </div>
  );
}
```

---

## Magnetic Buttons (Cursor Attraction)

```tsx
function MagneticButton({ children }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.35);
    y.set((e.clientY - centerY) * 0.35);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.button>
  );
}
```

---

## Gamification Primitives

| Element | Implementation |
|---------|--------------|
| Progress bar | Animated fill with spring, pulsing at milestone |
| Level up | Screen flash + particle burst + sound |
| Streak | Counter with bounce animation + fire emoji |
| Achievement badge | Scale in with overshoot + glow effect |
| Points counter | Number rolls up with easing |
| Loading as mini-game | Something interactive while waiting |

---

## The "Is It Too Much?" Test

- Does it serve a purpose (feedback, delight, orientation)?
- Is it shorter than 500ms for UI feedback?
- Can the user ignore or disable it?
- Does it work without motion (reduced-motion)?
- Does it feel _earned_ or _intrusive_?

If yes to all: ship it. If any "no": pull back.

---

## Output Format

Deliver:
1. **Delight opportunity map** — which moments in the product deserve game feel
2. **Animation implementation** — spring configs, particle effects, or reward moments
3. **Timing & intensity spec** — duration, scale factors, spring values
4. **Sound pairing** — audio to accompany each effect
5. **Reduced-motion fallback** — what users with motion sensitivity see

## Related Skills

- `micro-interactions` — The foundation game feel builds on
- `motion-advanced` — Advanced animation techniques
- `sound-design` — Audio is inseparable from game feel
- `scroll-driven-animation` — Scroll-linked game feel moments
- `3d-web` — 3D physics and particle systems
