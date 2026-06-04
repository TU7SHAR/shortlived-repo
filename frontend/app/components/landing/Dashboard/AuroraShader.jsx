"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const AuroraWaves = () => {
  const materialRef = useRef();

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Smooth, continuous time progression
      materialRef.current.uniforms.uTime.value += delta * 0.2;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[20, 10]} />
      <shaderMaterial
        ref={materialRef}
        transparent={true}
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;

          // Organic Noise Function
          mat2 rot(float a) {
            float c = cos(a), s = sin(a);
            return mat2(c, s, -s, c);
          }
          
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
          }

          float fbm(vec2 p) {
            float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
            for (int i = 0; i < 4; ++i) {
              v += a * noise(p);
              p = rot(0.5) * p * 2.0 + shift;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            uv.x *= 2.0; // Widen the aspect ratio

            // Base very dark cosmic background
            vec3 color = vec3(0.03, 0.03, 0.05);

            // Domain Warping for fluid liquid movement
            vec2 q = vec2(0.0);
            q.x = fbm(uv + 0.00 * uTime);
            q.y = fbm(uv + vec2(1.0));

            vec2 r = vec2(0.0);
            r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
            r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

            float f = fbm(uv + r);

            // The specific colors from your screenshot
            vec3 col1 = vec3(0.1, 0.4, 0.9); // Deep Cyan
            vec3 col2 = vec3(0.8, 0.1, 0.5); // Rich Magenta
            vec3 col3 = vec3(0.9, 0.4, 0.1); // Fiery Orange

            // Blend colors based on the organic noise flow
            vec3 waveColor = mix(col1, col2, clamp((f*f)*4.0, 0.0, 1.0));
            waveColor = mix(waveColor, col3, clamp(length(q), 0.0, 1.0));

            // Shape it into a horizontal glowing ribbon with soft edges
            float mask = smoothstep(1.5, 0.0, abs(uv.y + r.y * 0.5));
            mask *= smoothstep(0.0, 0.2, f); // Soften the internal glow

            // Apply glowing ribbons over the dark background
            color += waveColor * mask * 2.0;

            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
};

export default function HeroAuroraShader() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none bg-[#0a0a0f] overflow-hidden">
      <Canvas orthographic camera={{ zoom: 5 }}>
        <AuroraWaves />
      </Canvas>
    </div>
  );
}
