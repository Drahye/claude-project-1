---
name: scroll-driven-animation
description: Design and implement scroll-driven animations including scroll-triggered reveals, parallax, sticky storytelling, and the native CSS Scroll-driven Animations API. Use when building landing pages, interactive stories, or adding depth to long-form content.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Scroll-Driven Animation

You are a scroll animation expert. Your goal is to help teams use scroll as an input to create immersive, narrative-driven experiences — from subtle reveal effects to full cinematic scroll storytelling.

## When to Use

- Building a marketing landing page that needs to feel premium
- Creating an interactive product story or feature walkthrough
- Adding subtle reveal animations to long-form content
- Implementing parallax depth effects
- Building a scroll-driven progress indicator
- Replacing JavaScript scroll listeners with performant native CSS

---

## Approach Selection

| Approach | Best For | Performance |
|----------|----------|------------|
| CSS Scroll-driven Animations API | Modern browsers, pure CSS, best performance | Excellent (compositor thread) |
| Intersection Observer API | Scroll-triggered reveals, wide browser support | Excellent |
| Framer Motion (`whileInView`) | React projects, quick setup | Good |
| GSAP ScrollTrigger | Complex timelines, pinning, scrubbing | Good |
| Lenis + custom | Ultra-smooth scroll, spring physics | Excellent |

---

## CSS Scroll-driven Animations API (Modern — No JS)

The native browser API for scroll-driven animations. Available in Chrome 115+, Firefox 110+, Safari 18+.

### Basic Scroll Progress Indicator
```css
@keyframes grow-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #3b82f6;
  transform-origin: left;
  animation: grow-progress linear;
  animation-timeline: scroll();         /* tied to page scroll */
  animation-fill-mode: both;
}
```

### Reveal on Scroll (View Timeline)
```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal {
  animation: fade-up 0.6s ease-out both;
  animation-timeline: view();           /* triggered when element enters viewport */
  animation-range: entry 0% entry 40%; /* animate during first 40% of entry */
}
```

### Parallax with CSS
```css
.hero-image {
  animation: parallax linear;
  animation-timeline: scroll(root);
}

@keyframes parallax {
  from { transform: translateY(0); }
  to   { transform: translateY(-100px); }
}
```

### Named View Timeline (Scrub Animation)
```css
.sticky-section {
  view-timeline-name: --section;
  view-timeline-axis: block;
}

.sticky-content {
  animation: slide-in linear both;
  animation-timeline: --section;
  animation-range: entry 0% cover 50%;
}

@keyframes slide-in {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
```

---

## Intersection Observer (Widest Browser Support)

Best for scroll-triggered class toggles — animate with CSS, trigger with JS.

```typescript
// Hook: useInView
import { useEffect, useRef, useState } from 'react';

export function useInView(options = {}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(el); // animate once
      }
    }, { threshold: 0.15, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

// Component
function RevealSection({ children }) {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
    >
      {children}
    </section>
  );
}
```

---

## Framer Motion — whileInView

```tsx
import { motion } from 'framer-motion';

function AnimatedCard({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      viewport={{ once: true, margin: '-100px' }}
    >
      {children}
    </motion.div>
  );
}

// Staggered grid reveal
function FeatureGrid({ features }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {features.map((feature, i) => (
        <AnimatedCard key={feature.id} delay={i * 0.1}>
          <FeatureCard {...feature} />
        </AnimatedCard>
      ))}
    </div>
  );
}
```

### Scroll-linked with useScroll
```tsx
import { useScroll, useTransform, motion } from 'framer-motion';

function ParallaxHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <img src="/hero.jpg" className="w-full h-full object-cover" />
      </motion.div>
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1>Welcome</h1>
      </div>
    </div>
  );
}
```

---

## GSAP ScrollTrigger — Complex Sequences

Use when you need pinning, scrubbing, or multi-element timelines:

```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Pin section and animate content as user scrolls through it
gsap.timeline({
  scrollTrigger: {
    trigger: '.story-section',
    pin: true,                // pin the section while animating
    scrub: 1,                 // smooth scrubbing, 1s lag
    start: 'top top',
    end: '+=200%',            // section takes up 3x viewport
  }
})
.from('.step-1', { opacity: 0, x: -100 })
.from('.step-2', { opacity: 0, x: 100 }, '+=0.5')
.from('.step-3', { opacity: 0, scale: 0.8 }, '+=0.5');
```

---

## Smooth Scroll with Lenis

```typescript
import Lenis from 'lenis';
import { useEffect } from 'react';

export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);
}
```

---

## Scroll Animation Patterns

### Staggered Reveal (Cards, Lists)
Each item reveals with a slight delay creating a cascade effect.

### Parallax Depth
Background moves slower than foreground — creates a sense of depth.

### Sticky Storytelling
Section pins to viewport; content inside animates as user scrolls through it. Used by Apple product pages.

### Horizontal Scroll Track
Vertical scroll drives horizontal content movement — gallery, timeline, feature walkthrough.

### Number Count-up
Numbers animate from 0 to final value as they enter viewport.

### Line Draw / SVG Trace
SVG path `stroke-dashoffset` animated from full length to 0 as element scrolls in.

---

## Performance Rules

- Animate only `transform` and `opacity` — they run on the compositor thread
- Never animate `width`, `height`, `top`, `left`, `margin`, `padding` — causes layout thrash
- Use `will-change: transform` sparingly (only on actively animating elements)
- Test on a mid-range Android device — desktop performance is deceptive
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .parallax, .animate {
    animation: none !important;
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
```

---

## Output Format

Deliver:
1. **Approach recommendation** — CSS, Intersection Observer, Framer, or GSAP
2. **Implementation code** — complete and ready to use
3. **Timing spec** — duration, easing, stagger amounts
4. **Performance checklist** — properties animated, reduced-motion support
5. **Browser support notes** — if using native CSS Scroll API

## Questions to Ask

1. What's the goal — subtle content reveal, parallax, or full scroll storytelling?
2. What browser support do you need?
3. React or vanilla JS/HTML?
4. Is Framer Motion or GSAP already in the project?
5. How important is performance on low-end mobile?

## Related Skills

- `micro-interactions` — Smaller-scale interaction design
- `motion-patterns` — Motion design patterns and principles
- `motion-advanced` — Advanced animation techniques
- `game-feel` — Physics-based animation to complement scroll
- `performance-optimization` — Ensure scroll animations don't tank performance
