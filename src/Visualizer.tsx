import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Point {
  x: number;
  y: number;
  z: number;
  error?: string;
}

interface VisualizerProps {
  data: Point[];
}

// ---------------------------------------------------------------------------
// Scene – all 3D objects that react to data changes
// ---------------------------------------------------------------------------
function Scene({ data }: { data: Point[] }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // ---- Compute bounds in a single pass ----
  const { minZ, maxZ, rangeZ } = useMemo(() => {
    if (!data?.length) return { minZ: -10, maxZ: 10, rangeZ: 20 };

    let min = Infinity;
    let max = -Infinity;
    for (const p of data) {
      if (p.z < min) min = p.z;
      if (p.z > max) max = p.z;
    }
    // Pad bounds so the ground plane always sits below the data
    min = Math.min(min, -10);
    max = Math.max(max, 10);
    return { minZ: min, maxZ: max, rangeZ: max - min || 1 };
  }, [data]);

  // ---- Generate geometry with per‑point vertex colors ----
  const geometry = useMemo(() => {
    if (!data?.length) return null;

    const count = data.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const p = data[i];
      const idx = i * 3;

      // Map data to 3D space: x → x, y → z (height), z → y (depth)
      positions[idx] = p.x;
      positions[idx + 1] = p.z;
      positions[idx + 2] = p.y;

      if (p.error) {
        // Error: bright red
        colors[idx] = 1.0;
        colors[idx + 1] = 0.1;
        colors[idx + 2] = 0.1;
      } else {
        // Normal: 5-stop heatmap (blue → cyan → green → yellow → red)
        const t = Math.max(0, Math.min(1, (p.z - minZ) / rangeZ));
        let r = 0, g = 0, b = 0;

        if (t < 0.25) {
          const s = t / 0.25;        // blue → cyan
          r = 0; g = s; b = 1;
        } else if (t < 0.5) {
          const s = (t - 0.25) / 0.25; // cyan → green
          r = 0; g = 1; b = 1 - s;
        } else if (t < 0.75) {
          const s = (t - 0.5) / 0.25;  // green → yellow
          r = s; g = 1; b = 0;
        } else {
          const s = (t - 0.75) / 0.25; // yellow → red
          r = 1; g = 1 - s; b = 0;
        }

        colors[idx] = r;
        colors[idx + 1] = g;
        colors[idx + 2] = b;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [data, minZ, rangeZ]);

  // ---- Gentle idle rotation (pauses while user interacts) ----
  useFrame((_, delta) => {
    if (autoRotate && pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
    }
  });

  if (!geometry) return null;

  const groundY = minZ - 2;

  return (
    <>
      <color attach="background" args={['#09090b']} />
      <fog attach="fog" args={['#09090b', 30, 90]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#3b82f6" />

      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      {/* Ground plane and grid – always anchored below the lowest point */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#18181b" transparent opacity={0.5} />
      </mesh>
      <gridHelper args={[100, 50, '#27272a', '#18181b']} position={[0, groundY, 0]} />
      <axesHelper args={[15]} />

      <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          size={0.4}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={100}
        onStart={() => setAutoRotate(false)}
        onEnd={() => setAutoRotate(true)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Visualizer – wrapper with Canvas and UI overlays
// ---------------------------------------------------------------------------
export function Visualizer({ data }: VisualizerProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="w-full h-full bg-zinc-950 relative overflow-hidden rounded-lg">
      <Canvas
        camera={{ position: [25, 25, 25], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        {!isEmpty && <Scene data={data} />}
      </Canvas>

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900/90 px-6 py-4 rounded-xl border border-zinc-800 text-zinc-400 text-sm backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
              Run the experiment to generate Monte Carlo points
            </div>
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800 backdrop-blur-sm text-xs text-zinc-400">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Error points</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Height mapped (blue→red)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
