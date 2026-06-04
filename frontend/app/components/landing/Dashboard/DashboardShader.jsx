"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

// ===== 1. ANIMATED GRID SHADER (Cyberpunk vibe) =====
const AnimatedGridShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            vec2 uv = vUv;
            
            // Animated grid lines moving down
            float gridX = abs(sin((uv.x * 15.0) + time * 0.5));
            float gridY = abs(sin((uv.y * 15.0 - time * 3.0)));
            
            float grid = (gridX * 0.6 + gridY * 0.6);
            grid = smoothstep(0.85, 0.95, grid);
            
            // Add glow pulse
            float pulse = sin(time * 2.0) * 0.5 + 0.5;
            float alpha = grid * (0.4 + pulse * 0.6);
            
            gl_FragColor = vec4(0.2, 0.2, 0.22, alpha * 0.8);
          }
        `}
      />
    </mesh>
  );
};

// ===== 2. PULSING PARTICLE FIELD =====
const PulsingParticlesShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          void main() {
            vec2 uv = vUv;
            
            // Create particle grid
            vec2 id = floor(uv * 8.0);
            vec2 st = fract(uv * 8.0);
            
            // Random positions for each particle
            float randomX = noise(id);
            float randomY = noise(id + vec2(1.0));
            
            // Animate particles
            float wobble = sin(time * 2.0 + randomX * 6.28) * 0.2;
            float wobbleY = cos(time * 1.5 + randomY * 6.28) * 0.2;
            
            vec2 particlePos = vec2(0.5 + wobble, 0.5 + wobbleY);
            float dist = length(st - particlePos);
            
            // Create visible circles
            float particle = smoothstep(0.2, 0.05, dist);
            
            // Pulsing brightness
            float pulse = sin(time * 3.0 + randomX * 10.0) * 0.5 + 0.5;
            float alpha = particle * pulse;
            
            gl_FragColor = vec4(0.15, 0.15, 0.2, alpha * 0.7);
          }
        `}
      />
    </mesh>
  );
};

// ===== 3. FLOWING LINES SHADER =====
const FlowingLinesShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            vec2 uv = vUv;
            
            // Create multiple flowing wave lines
            float wave1 = sin(uv.x * 8.0 - time * 3.0 + uv.y * 4.0) * 0.5 + 0.5;
            float wave2 = cos(uv.x * 6.0 - time * 2.5 + uv.y * 3.0) * 0.5 + 0.5;
            float wave3 = sin(uv.y * 10.0 - time * 2.0) * 0.5 + 0.5;
            
            // Combine waves
            float lines = wave1 * 0.4 + wave2 * 0.35 + wave3 * 0.25;
            
            // Make lines stand out
            lines = smoothstep(0.45, 0.65, lines);
            
            // Distance falloff for more drama
            float dist = length(uv - 0.5);
            float falloff = 1.0 - (dist * 0.8);
            
            float alpha = lines * falloff * 0.9;
            gl_FragColor = vec4(0.25, 0.25, 0.3, alpha);
          }
        `}
      />
    </mesh>
  );
};

// ===== 4. HEXAGON PATTERN SHADER =====
const HexagonPatternShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            vec2 uv = vUv - 0.5;
            
            // Create hexagon grid pattern
            float hexSize = 0.08;
            
            // Create a honeycomb pattern
            float hex1 = abs(mod(uv.x * 12.0, 2.0) - 1.0);
            float hex2 = abs(mod(uv.y * 10.0, 2.0) - 1.0);
            float hex3 = abs(mod((uv.x + uv.y) * 6.0, 2.0) - 1.0);
            
            // Combine for hexagon effect
            float hexagon = min(hex1, min(hex2, hex3));
            hexagon = smoothstep(0.15, 0.05, hexagon);
            
            // Animate the pattern
            float wave = sin(length(uv) * 5.0 - time * 2.0) * 0.5 + 0.5;
            
            // Pulsing hexagons
            float pulse = sin(time * 1.5) * 0.5 + 0.5;
            float alpha = hexagon * wave * pulse;
            
            gl_FragColor = vec4(0.2, 0.2, 0.25, alpha * 0.85);
          }
        `}
      />
    </mesh>
  );
};

// ===== 5. NEON GLOW ORBS =====
const NeonGlowOrbsShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          void main() {
            vec2 uv = vUv;
            
            // Create multiple moving orbs
            float time1 = time * 0.5;
            float time2 = time * 0.7;
            float time3 = time * 0.3;
            
            vec2 orb1 = vec2(sin(time1) * 0.3 + 0.5, cos(time1 * 0.7) * 0.3 + 0.5);
            vec2 orb2 = vec2(sin(time2 + 2.0) * 0.3 + 0.5, cos(time2 * 1.2 + 2.0) * 0.3 + 0.5);
            vec2 orb3 = vec2(sin(time3 + 4.0) * 0.3 + 0.5, cos(time3 * 0.9 + 4.0) * 0.3 + 0.5);
            
            // Calculate glow for each orb
            float dist1 = length(uv - orb1);
            float dist2 = length(uv - orb2);
            float dist3 = length(uv - orb3);
            
            float glow1 = exp(-dist1 * 8.0) * 0.8;
            float glow2 = exp(-dist2 * 8.0) * 0.6;
            float glow3 = exp(-dist3 * 8.0) * 0.7;
            
            float totalGlow = glow1 + glow2 + glow3;
            totalGlow = min(totalGlow, 1.0);
            
            gl_FragColor = vec4(0.15, 0.15, 0.2, totalGlow * 0.9);
          }
        `}
      />
    </mesh>
  );
};

// ===== 6. ELECTRIC SCAN LINES =====
const ElectricScanLinesShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            vec2 uv = vUv;
            
            // Animated scan line moving top to bottom
            float scanLine = mod(uv.y * 20.0 - time * 8.0, 1.0);
            float scan = smoothstep(0.3, 0.15, abs(scanLine - 0.5));
            
            // Add horizontal lines
            float hLines = abs(sin(uv.y * 50.0)) * 0.5 + 0.5;
            hLines = smoothstep(0.85, 0.95, hLines);
            
            // Combine effects
            float alpha = (scan * 0.7 + hLines * 0.3) * 0.8;
            
            gl_FragColor = vec4(0.1, 0.1, 0.15, alpha);
          }
        `}
      />
    </mesh>
  );
};

// ===== 7. LIQUID METAL SHADER =====
const LiquidMetalShader = () => {
  const mesh = useRef();

  useFrame((state) => {
    if (mesh.current?.material?.uniforms) {
      mesh.current.material.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        transparent={true}
        uniforms={{ time: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float time;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          void main() {
            vec2 uv = vUv;
            
            // Create flowing metallic effect
            float wave1 = sin(uv.x * 10.0 + time * 2.0) * cos(uv.y * 8.0 - time * 1.5);
            float wave2 = cos(uv.x * 15.0 - time * 1.8) * sin(uv.y * 12.0 + time * 2.2);
            
            float metalic = wave1 * 0.6 + wave2 * 0.4;
            metalic = metalic * 0.5 + 0.5;
            
            // Add shimmer
            float shimmer = noise(uv + time * 0.2);
            metalic = metalic * 0.7 + shimmer * 0.3;
            
            // Distance-based falloff
            float dist = length(uv - 0.5);
            float falloff = exp(-dist * 1.2);
            
            float alpha = metalic * falloff * 0.8;
            
            gl_FragColor = vec4(0.3, 0.3, 0.32, alpha);
          }
        `}
      />
    </mesh>
  );
};

// ===== CANVAS WRAPPERS =====
const AnimatedGridCanvas = () => (
  <Canvas>
    <AnimatedGridShader />
  </Canvas>
);
const PulsingParticlesCanvas = () => (
  <Canvas>
    <PulsingParticlesShader />
  </Canvas>
);
const FlowingLinesCanvas = () => (
  <Canvas>
    <FlowingLinesShader />
  </Canvas>
);
const HexagonPatternCanvas = () => (
  <Canvas>
    <HexagonPatternShader />
  </Canvas>
);
const NeonGlowOrbsCanvas = () => (
  <Canvas>
    <NeonGlowOrbsShader />
  </Canvas>
);
const ElectricScanLinesCanvas = () => (
  <Canvas>
    <ElectricScanLinesShader />
  </Canvas>
);
const LiquidMetalCanvas = () => (
  <Canvas>
    <LiquidMetalShader />
  </Canvas>
);

// ===== MAIN COMPONENT =====
export default function DashboardShader({ shaderType = "neonOrbs" }) {
  const shaders = {
    grid: <AnimatedGridCanvas />,
    particles: <PulsingParticlesCanvas />,
    flowingLines: <FlowingLinesCanvas />,
    hexagon: <HexagonPatternCanvas />,
    neonOrbs: <NeonGlowOrbsCanvas />,
    scanLines: <ElectricScanLinesCanvas />,
    liquidMetal: <LiquidMetalCanvas />,
  };

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      {shaders[shaderType] || shaders.neonOrbs}
    </div>
  );
}
