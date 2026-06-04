"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- SHADER DEFINITIONS ---

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 iResolution;
  uniform float iTime;

  float opSmoothUnion( float d1, float d2, float k ) {
      float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
      return mix( d2, d1, h ) - k*h*(1.0-h);
  }

  float hash13(vec3 p3) {
      p3  = fract(p3 * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
  }

  vec3 opRep( in vec3 p, in vec3 c, out vec3 idx) {
      p = (p + 0.5 * c) / c;
      vec3 floorP = floor(p);
      vec3 fractP = fract(p);
      idx = floorP;
      return fractP * c - 0.5 * c;
  }

  float sdCapsule( vec3 p, vec3 a, vec3 b, float r ) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
  }

  vec2 map(vec3 p) {
      vec3 idx;
      // Grid repetition space
      p = opRep(p, vec3(6.0, 3.0, 5.0), idx);
      
      vec2 res = vec2(0.0, 0.0);
      float thickness = 0.22; // Slightly thinner for elegance
      float d = 100.0;
      
      // Random glitch/flicker effect based on grid ID
      float r = hash13(idx * 100.0 + floor(iTime * 2.14));
      if (r > 0.2 + step(dot(idx, idx), 0.5)) {
          return vec2(0.75, 0.0);
      }
      
      // ==========================================
      // SALESJI MONOGRAM (S J i) - SDF MATH
      // ==========================================
      
      // Letter "S"
      d = min(d, sdCapsule(p, vec3(-2.0, 0.6, 0.0), vec3(-1.0, 0.6, 0.0), thickness)); // Top
      d = min(d, sdCapsule(p, vec3(-2.0, 0.6, 0.0), vec3(-2.0, 0.1, 0.0), thickness)); // Top-Left Drop
      d = min(d, sdCapsule(p, vec3(-2.0, 0.1, 0.0), vec3(-1.0, 0.1, 0.0), thickness)); // Middle
      d = min(d, sdCapsule(p, vec3(-1.0, 0.1, 0.0), vec3(-1.0, -0.4, 0.0), thickness)); // Bottom-Right Drop
      d = min(d, sdCapsule(p, vec3(-1.0, -0.4, 0.0), vec3(-2.0, -0.4, 0.0), thickness)); // Bottom

      // Letter "J"
      d = min(d, sdCapsule(p, vec3(0.0, 0.6, 0.0), vec3(1.0, 0.6, 0.0), thickness)); // Top Hat
      d = min(d, sdCapsule(p, vec3(0.5, 0.6, 0.0), vec3(0.5, -0.4, 0.0), thickness)); // Main Stem
      d = min(d, sdCapsule(p, vec3(0.5, -0.4, 0.0), vec3(0.0, -0.4, 0.0), thickness)); // Hook Bottom
      d = min(d, sdCapsule(p, vec3(0.0, -0.4, 0.0), vec3(0.0, -0.1, 0.0), thickness)); // Hook Left

      // Letter "i"
      d = min(d, sdCapsule(p, vec3(1.8, 0.2, 0.0), vec3(1.8, -0.4, 0.0), thickness)); // Stem
      d = min(d, sdCapsule(p, vec3(1.8, 0.6, 0.0), vec3(1.8, 0.65, 0.0), thickness)); // Dot (Tiny capsule)
      
      res.x = d;
      res.y = step(0.24, p.z);
      
      return res;
  }

  vec3 calcNormal( in vec3 p ) {
      const float h = 1e-5; 
      const vec2 k = vec2(1,-1);
      return normalize( k.xyy*map( p + k.xyy*h ).x + 
                        k.yyx*map( p + k.yyx*h ).x + 
                        k.yxy*map( p + k.yxy*h ).x + 
                        k.xxx*map( p + k.xxx*h ).x );
  }

  vec2 rotate(vec2 v, float a) {
      float s = sin(a);
      float c = cos(a);
      mat2 m = mat2(c, s, -s, c);
      return m * v;
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
      vec2 uv = fragCoord/iResolution.xy;
      
      // Camera Fly-through Math
      float t = iTime * 0.2;
      vec3 off0 = fract(vec3(t * 2.516 - 0.642, -t * 0.541 - 0.624, t * 0.532 - 0.74)) - 0.5;
      vec3 off1 = fract(vec3(-t * 0.512 - 0.3412, t * 2.537 - 0.92, -t * 0.5327 - 0.24)) - 0.5;
      vec3 off2 = fract(vec3(t * 0.47 - 0.835, t * 0.537 - 0.753, -t * 0.47 - 0.845)) - 0.5;
      vec3 off3 = fract(vec3(t * 0.324 - 0.23, -t * 0.537 - 0.324, t * 2.5327 - 0.56)) - 0.5;
      
      vec3 rayOri = vec3(0.0, 0.0, 3.0) + off0 * off2 * vec3(12.0, 12.0, 6.0);
      vec3 target = vec3(rotate((uv - 0.5) * vec2(iResolution.x/iResolution.y, 1.0), dot(off0, off1) * 3.0) * 6.0, 0.0) + off1 * off3 * vec3(12.0, 12.0, 6.0);
      vec3 rayDir = normalize(target - rayOri);
      
      float depth = 0.0;
      vec3 p;
      vec2 res;
      
      // Raymarching Loop
      for(int i = 0; i < 64; i++) {
          p = rayOri + rayDir * depth;
          res = map(p);
          depth += res.x;
          if (res.x < 1e-5) break;
      }
      
      depth = min(50.0, depth);
      vec3 n = calcNormal(p);
      
      // Lighting & Shading
      float b = max(0.0, dot(n, vec3(0.577)));
      
      // TINT COLOR: Currently a glowing white/silver. 
      // You can change vec3(1.0) to vec3(0.2, 0.6, 1.0) for a blue tint.
      vec3 col = mix(vec3(0.5), vec3(1.0), b) * 1.75; 
      
      col *= exp((-depth + 0.5) * 0.15);
      col *= max(smoothstep(0.1, 0.5, res.x) + 0.075 * b, res.y);
      
      fragColor = vec4(col, 1.0 - (depth - 1.0) / 20.0);
  }

  void main() {
    vec4 color;
    mainImage(color, gl_FragCoord.xy);
    gl_FragColor = color;
  }
`;

const ShaderPlane = () => {
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
        depthWrite={false}
        depthTest={false}
        transparent={true}
      />
    </mesh>
  );
};

export default function SalesJiLogoShader() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        backgroundColor: "#000",
      }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
