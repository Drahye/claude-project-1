---
name: generative-design
description: Create generative and procedural visual design using creative coding, p5.js, canvas, SVG, and shader art. Use when building unique brand visuals, animated backgrounds, NFT art, data-driven generative patterns, or interactive creative experiences.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Generative Design

You are a creative coding and generative design expert. Your goal is to help teams create visuals that are unique, procedural, and alive — patterns and images born from algorithms rather than drawn by hand.

## When to Use

- Designing a unique animated background for a landing page
- Building a brand identity with procedural patterns
- Creating generative NFT or digital art
- Making a data-driven visualization that's also beautiful
- Building an interactive creative experience or playground
- Generating infinite variations of a visual (no two look the same)

---

## Tools & Libraries

| Tool | Best For |
|------|----------|
| **p5.js** | Creative coding, beginners, 2D canvas, large community |
| **Canvas API** | Native browser, maximum control, no dependencies |
| **SVG + JS** | Scalable generative patterns, filter effects |
| **GLSL / WebGL Shaders** | GPU-accelerated, real-time, stunning effects |
| **Three.js TSL** | Shader graph in JavaScript (see `webgpu-threejs-tsl`) |
| **D3.js** | Data-driven generative forms |
| **Pts.js** | Points and vectors, math-heavy creative coding |

---

## p5.js — Foundation Patterns

### Perlin Noise Flow Field
```javascript
let particles = [];
let noiseScale = 0.003;
let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(10);
  stroke(255, 255, 255, 30);
  strokeWeight(0.8);

  for (let i = 0; i < 3000; i++) {
    particles.push(createVector(random(width), random(height)));
  }
}

function draw() {
  for (let p of particles) {
    const angle = noise(p.x * noiseScale, p.y * noiseScale, t) * TWO_PI * 4;
    p.x += cos(angle) * 1.5;
    p.y += sin(angle) * 1.5;

    // Wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    point(p.x, p.y);
  }
  t += 0.002;
}
```

### Recursive Tree
```javascript
function branch(len, angle) {
  if (len < 4) return;

  stroke(200, 150, 80, map(len, 4, 100, 80, 255));
  strokeWeight(map(len, 4, 100, 0.5, 4));
  line(0, 0, 0, -len);
  translate(0, -len);

  const spread = random(0.3, 0.5);

  push();
  rotate(angle);
  branch(len * random(0.65, 0.75), angle);
  pop();

  push();
  rotate(-angle);
  branch(len * random(0.65, 0.75), angle);
  pop();
}
```

### Truchet Tiles (Procedural Pattern)
```javascript
function setup() {
  createCanvas(600, 600);
  noLoop();
  background(20);
}

function draw() {
  const tileSize = 40;
  noFill();
  strokeWeight(2);

  for (let x = 0; x < width; x += tileSize) {
    for (let y = 0; y < height; y += tileSize) {
      const hue = map(x + y, 0, width + height, 200, 300);
      stroke(`hsl(${hue}, 70%, 60%)`);

      push();
      translate(x + tileSize / 2, y + tileSize / 2);

      if (random() > 0.5) {
        arc(-tileSize/2, -tileSize/2, tileSize, tileSize, 0, HALF_PI);
        arc(tileSize/2, tileSize/2, tileSize, tileSize, PI, PI + HALF_PI);
      } else {
        arc(tileSize/2, -tileSize/2, tileSize, tileSize, HALF_PI, PI);
        arc(-tileSize/2, tileSize/2, tileSize, tileSize, PI + HALF_PI, TWO_PI);
      }
      pop();
    }
  }
}
```

---

## Canvas API — Animated Gradient Mesh

```typescript
class GradientMesh {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private points: { x: number; y: number; vx: number; vy: number; color: string }[];
  private t = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.points = [
      { x: 0.2, y: 0.2, vx: 0.0003, vy: 0.0004, color: '#3b82f6' },
      { x: 0.8, y: 0.3, vx: -0.0004, vy: 0.0003, color: '#8b5cf6' },
      { x: 0.5, y: 0.8, vx: 0.0002, vy: -0.0005, color: '#ec4899' },
      { x: 0.3, y: 0.6, vx: -0.0003, vy: 0.0002, color: '#f59e0b' },
    ];
  }

  render() {
    const { width, height } = this.canvas;
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // Update positions with sine wave oscillation
    const movers = this.points.map(p => ({
      x: (p.x + Math.sin(this.t * p.vx * 1000) * 0.3) * width,
      y: (p.y + Math.cos(this.t * p.vy * 1000) * 0.3) * height,
      color: p.color,
    }));

    // Per-pixel color blending
    for (let i = 0; i < width * height; i++) {
      const px = i % width;
      const py = Math.floor(i / width);

      let r = 0, g = 0, b = 0, totalWeight = 0;
      for (const m of movers) {
        const dist = Math.hypot(px - m.x, py - m.y);
        const weight = 1 / (dist * dist + 1);
        const c = hexToRgb(m.color);
        r += c.r * weight; g += c.g * weight; b += c.b * weight;
        totalWeight += weight;
      }

      data[i * 4]     = r / totalWeight;
      data[i * 4 + 1] = g / totalWeight;
      data[i * 4 + 2] = b / totalWeight;
      data[i * 4 + 3] = 255;
    }

    this.ctx.putImageData(imageData, 0, 0);
    this.t++;
    requestAnimationFrame(() => this.render());
  }
}
```

---

## GLSL Shader — Real-Time Generative Art

Run on GPU — millions of pixels computed in parallel:

```glsl
// Fragment shader — animated plasma
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  float v = 0.0;
  v += sin(uv.x * 5.0 + uTime);
  v += sin(uv.y * 4.0 + uTime * 0.7);
  v += sin((uv.x + uv.y) * 3.0 + uTime * 0.5);
  v += sin(length(uv) * 6.0 - uTime);

  vec3 color = 0.5 + 0.5 * cos(uTime + v + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}
```

Embed in React with:
```tsx
// Use react-shader-canvas or Three.js ShaderMaterial
import { ShaderCanvas } from 'react-shader-canvas';
<ShaderCanvas fragmentShader={shaderSource} uniforms={{ uTime: { value: 0 } }} />
```

---

## SVG Generative Patterns

```typescript
function generateSVGPattern(seed: number): string {
  const rng = seededRandom(seed);
  const shapes = [];

  for (let i = 0; i < 50; i++) {
    const x = rng() * 400;
    const y = rng() * 400;
    const r = rng() * 30 + 5;
    const hue = rng() * 60 + 200; // blue-purple range

    shapes.push(
      `<circle cx="${x}" cy="${y}" r="${r}"
        fill="hsl(${hue}, 70%, 60%)"
        opacity="${rng() * 0.5 + 0.3}" />`
    );
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <filter id="blur"><feGaussianBlur stdDeviation="8"/></filter>
      <g filter="url(#blur)">${shapes.join('')}</g>
    </svg>
  `;
}
```

---

## React Integration (p5.js)

```tsx
import { useEffect, useRef } from 'react';
import p5 from 'p5';

export function P5Canvas({ sketch }: { sketch: (p: p5) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const instance = new p5(sketch, containerRef.current!);
    return () => instance.remove();
  }, [sketch]);

  return <div ref={containerRef} className="w-full h-full" />;
}

// Usage
const mySketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(10);
  };
  p.draw = () => {
    // ... your generative code
  };
};

<P5Canvas sketch={mySketch} />
```

---

## Design Principles for Generative Art

- **Constrained randomness** — pure random is noise; constrained random is texture
- **Repetition with variation** — same rule applied everywhere, but never exactly the same
- **Emergence** — simple rules produce complex behavior
- **Seed-based** — same seed = same output; enables reproducibility
- **Color harmony** — limit palette; procedural hue shifts within a range

---

## Output Format

Deliver:
1. **Sketch code** — complete p5.js, canvas, or shader implementation
2. **Parameter guide** — which values to tweak for different aesthetics
3. **React wrapper** — how to embed in a React/Next.js project
4. **Seed system** — if the output should be reproducible
5. **Export method** — how to save as PNG/SVG/video

## Questions to Ask

1. What's the output used for — web background, brand asset, NFT, interactive installation?
2. Should it be interactive (respond to mouse/scroll)?
3. What aesthetic — organic/natural, geometric/mechanical, data-driven?
4. What's the color palette or brand colors?
5. Does it need to be reproducible (same seed = same result)?

## Related Skills

- `3d-web` — Take generative work into 3D with Three.js
- `webgpu-threejs-tsl` — GPU-accelerated generative shaders
- `scroll-driven-animation` — Connect generative visuals to scroll
- `brandkit` — Use generative patterns as brand assets
- `game-feel` — Add generative particle effects to interactions
