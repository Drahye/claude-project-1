---
name: 3d-web
description: Build 3D web experiences using React Three Fiber, Drei, and Spline including product visualization, immersive scenes, 3D UI elements, and interactive models. Use when adding a 3D hero, product configurator, immersive background, or WebGL scene to a web product.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# 3D Web

You are a 3D web expert. Your goal is to help teams add 3D experiences to web products using React Three Fiber — from subtle 3D hero elements to full interactive product visualizers.

## When to Use

- Adding a 3D product visualization or configurator
- Building an immersive landing page hero with 3D elements
- Creating interactive 3D backgrounds, gradients, or particle fields
- Implementing a 3D model viewer (gltf/glb)
- Adding depth and physicality to UI elements
- Building for WebXR (VR/AR experiences)

---

## Tool Selection

| Tool | Best For |
|------|----------|
| **React Three Fiber (R3F)** | React apps, declarative 3D, full control |
| **Drei** | R3F helpers, cameras, controls, shaders (always use with R3F) |
| **@react-three/rapier** | Physics — rigid bodies, collisions |
| **@react-three/postprocessing** | Visual effects — bloom, DOF, chromatic aberration |
| **Spline** | No-code 3D, embed in minutes, great for marketing sites |
| **Three.js (vanilla)** | Non-React projects, maximum control |

**Default**: React Three Fiber + Drei for React projects. Spline for fast marketing embeds.

---

## React Three Fiber — Getting Started

```bash
npm install three @react-three/fiber @react-three/drei
```

### Basic Scene
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function RotatingBox() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Environment preset="city" />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <RotatingBox />
      </Float>

      <OrbitControls enablePan={false} minDistance={3} maxDistance={10} />
    </Canvas>
  );
}
```

---

## Loading 3D Models (GLTF/GLB)

```tsx
import { useGLTF, Stage, PresentationControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

function ProductModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={1.5} />;
}

// Preload for performance
useGLTF.preload('/models/product.glb');

export function ProductViewer() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 45 }}>
      <Suspense fallback={null}>
        <PresentationControls
          global
          rotation={[0.13, 0.1, 0]}
          polar={[-0.4, 0.2]}
          azimuth={[-1, 0.75]}
          config={{ mass: 2, tension: 400 }}
          snap={{ mass: 4, tension: 400 }}
        >
          <Stage environment="city" intensity={0.5}>
            <ProductModel url="/models/product.glb" />
          </Stage>
        </PresentationControls>
      </Suspense>
    </Canvas>
  );
}
```

---

## Shader Materials (Custom Visuals)

```tsx
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const GradientMaterial = shaderMaterial(
  { uTime: 0, uColor1: new THREE.Color('#3b82f6'), uColor2: new THREE.Color('#8b5cf6') },
  // Vertex shader
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  // Fragment shader
  `uniform float uTime;
   uniform vec3 uColor1;
   uniform vec3 uColor2;
   varying vec2 vUv;
   void main() {
     float t = vUv.x + sin(vUv.y * 3.0 + uTime) * 0.1;
     gl_FragColor = vec4(mix(uColor1, uColor2, t), 1.0);
   }`
);

extend({ GradientMaterial });

function AnimatedPlane() {
  const matRef = useRef();
  useFrame(({ clock }) => { matRef.current.uTime = clock.elapsedTime; });

  return (
    <mesh>
      <planeGeometry args={[4, 4, 32, 32]} />
      <gradientMaterial ref={matRef} />
    </mesh>
  );
}
```

---

## Particle Systems

```tsx
import { Points, PointMaterial } from '@react-three/drei';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function StarField({ count = 3000 }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.05;
  });

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial size={0.02} color="#ffffff" sizeAttenuation transparent opacity={0.8} />
    </Points>
  );
}
```

---

## Post-Processing Effects

```tsx
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

function Effects() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        intensity={1.5}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.002, 0.002]}
      />
      <Vignette darkness={0.5} offset={0.5} />
    </EffectComposer>
  );
}
```

---

## Physics with Rapier

```tsx
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';

function PhysicsScene() {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      {/* Falling box */}
      <RigidBody>
        <mesh position={[0, 5, 0]}>
          <boxGeometry />
          <meshStandardMaterial color="orange" />
        </mesh>
      </RigidBody>

      {/* Floor */}
      <RigidBody type="fixed">
        <CuboidCollider args={[5, 0.1, 5]} position={[0, -2, 0]} />
      </RigidBody>
    </Physics>
  );
}
```

---

## Spline (No-Code 3D)

For marketing sites where speed > control:

```tsx
import Spline from '@splinetool/react-spline';

export function HeroSpline() {
  return (
    <Spline
      scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode"
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

Create at spline.design — export as React embed. Interactions, scroll events, and events all configurable in the editor.

---

## Performance

- Use `dpr={[1, 2]}` — cap pixel ratio at 2
- Dispose of geometries and materials on unmount
- Use `<Suspense>` with a fallback for model loading
- Merge static geometries (drei's `<Merged>`)
- Use `instancedMesh` for repeated objects (100x+ objects)
- Avoid per-frame allocations in `useFrame` callbacks
- Test on mobile — WebGL is GPU-limited on phones

---

## Output Format

Deliver:
1. **Scene setup** — Canvas, lighting, camera, and environment
2. **Core component** — the 3D object, model, or effect
3. **Interaction** — controls or scroll-linked animation
4. **Post-processing** — optional visual effects layer
5. **Performance notes** — disposal, LOD, mobile considerations

## Questions to Ask

1. What's the 3D element for — hero, product viewer, background, configurator?
2. Is this a React project?
3. Do you have 3D assets (GLB files) or need to build geometry programmatically?
4. What's the target device — desktop only or mobile too?
5. How important is load time vs. visual quality?

## Related Skills

- `webgpu-threejs-tsl` — Low-level WebGPU and Three.js shader authoring
- `scroll-driven-animation` — Connect 3D scenes to scroll position
- `game-feel` — Add physics and spring dynamics to 3D objects
- `performance-optimization` — Optimize WebGL for production
- `motion-advanced` — Advanced animation techniques applicable to 3D
