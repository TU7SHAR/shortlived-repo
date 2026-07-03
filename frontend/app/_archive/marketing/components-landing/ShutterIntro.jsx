"use client";

import React, { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- FLOWING WHITE PARTICLES SHADER ---
const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform float iTime;
  uniform vec3 iResolution;

  void main() {
      vec2 uv = gl_FragCoord.xy / iResolution.y;

      uv.y -= iTime * 0.15;
      uv.x += sin(iTime * 0.2 + uv.y * 1.5) * 0.05; 

      float particleAlpha = 0.0;

      for(float i = 1.0; i <= 3.0; i++) {
          vec2 grid = uv * (12.0 * i);
          vec2 id = floor(grid);
          vec2 f = fract(grid) - 0.5;

          float h = fract(sin(dot(id, vec2(12.9898, 78.233))) * 43758.5453);

          vec2 offset = vec2(fract(h * 123.45) - 0.5, fract(h * 678.90) - 0.5) * 0.6;

          float radius = 0.02 / i;
          float dist = length(f - offset);
          float glow = smoothstep(radius * 4.0, 0.0, dist) * 0.4;
          float core = smoothstep(radius, 0.0, dist);

          float twinkle = 0.5 + 0.5 * sin(iTime * 3.0 + h * 6.28);

          particleAlpha += (core + glow) * twinkle * step(0.7, h); 
      }

      gl_FragColor = vec4(1.0, 1.0, 1.0, clamp(particleAlpha, 0.0, 1.0));
  }
`;

const ParticlePlane = () => {
  const materialRef = useRef();

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
    }),
    [],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.iTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.iResolution.value.set(
        state.size.width * state.viewport.dpr,
        state.size.height * state.viewport.dpr,
        1,
      );
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export default function ShutterIntro() {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".letter", {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.05,
        ease: "expo.out",
        delay: 0.2,
      });

      tl.to(
        ".letter",
        {
          scale: 1.4,
          opacity: 0,
          duration: 0.8,
          ease: "power3.inOut",
          stagger: 0.03,
        },
        "+=0.4",
      );

      tl.to(
        containerRef.current,
        {
          yPercent: -100,
          duration: 1.2,
          ease: "expo.inOut",
        },
        "-=0.6",
      );

      tl.set(containerRef.current, { display: "none" });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none bg-black/5 backdrop-blur-sm"
    >
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
          <ParticlePlane />
        </Canvas>
      </div>

      <div className="relative z-20 flex overflow-visible">
        {"SALESJI".split("").map((char, i) => (
          <span
            key={i}
            className="letter inline-block text-white text-6xl md:text-9xl font-black tracking-tighter uppercase drop-shadow-2xl"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
