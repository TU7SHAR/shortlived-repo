"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 iResolution;
  uniform float iTime;

  // --- 2D MATH LINE GENERATOR ---
  float sdLine(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
  }

  // --- PROCEDURAL FONT GENERATOR: "SALESJI" ---
  float mapSalesJi(vec2 p) {
      float d = 100.0;
      
      // S
      vec2 q = p - vec2(-2.7, 0.0);
      d = min(d, sdLine(q, vec2(0.2, 0.4), vec2(-0.2, 0.4)));
      d = min(d, sdLine(q, vec2(-0.2, 0.4), vec2(-0.2, 0.0)));
      d = min(d, sdLine(q, vec2(-0.2, 0.0), vec2(0.2, 0.0)));
      d = min(d, sdLine(q, vec2(0.2, 0.0), vec2(0.2, -0.4)));
      d = min(d, sdLine(q, vec2(0.2, -0.4), vec2(-0.2, -0.4)));

      // A
      q = p - vec2(-1.8, 0.0);
      d = min(d, sdLine(q, vec2(-0.25, -0.4), vec2(0.0, 0.4)));
      d = min(d, sdLine(q, vec2(0.25, -0.4), vec2(0.0, 0.4)));
      d = min(d, sdLine(q, vec2(-0.12, 0.0), vec2(0.12, 0.0)));

      // L
      q = p - vec2(-0.9, 0.0);
      d = min(d, sdLine(q, vec2(-0.1, 0.4), vec2(-0.1, -0.4)));
      d = min(d, sdLine(q, vec2(-0.1, -0.4), vec2(0.3, -0.4)));

      // E
      q = p - vec2(0.0, 0.0);
      d = min(d, sdLine(q, vec2(-0.2, 0.4), vec2(0.2, 0.4)));
      d = min(d, sdLine(q, vec2(-0.2, 0.4), vec2(-0.2, -0.4)));
      d = min(d, sdLine(q, vec2(-0.2, 0.0), vec2(0.1, 0.0)));
      d = min(d, sdLine(q, vec2(-0.2, -0.4), vec2(0.2, -0.4)));

      // S
      q = p - vec2(0.9, 0.0);
      d = min(d, sdLine(q, vec2(0.2, 0.4), vec2(-0.2, 0.4)));
      d = min(d, sdLine(q, vec2(-0.2, 0.4), vec2(-0.2, 0.0)));
      d = min(d, sdLine(q, vec2(-0.2, 0.0), vec2(0.2, 0.0)));
      d = min(d, sdLine(q, vec2(0.2, 0.0), vec2(0.2, -0.4)));
      d = min(d, sdLine(q, vec2(0.2, -0.4), vec2(-0.2, -0.4)));

      // J
      q = p - vec2(1.8, 0.0);
      d = min(d, sdLine(q, vec2(0.2, 0.4), vec2(0.2, -0.2)));
      d = min(d, sdLine(q, vec2(0.2, -0.2), vec2(0.0, -0.4)));
      d = min(d, sdLine(q, vec2(0.0, -0.4), vec2(-0.2, -0.2)));

      // I
      q = p - vec2(2.7, 0.0);
      d = min(d, sdLine(q, vec2(0.0, 0.4), vec2(0.0, -0.4)));
      
      return d;
  }

  void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
      
      // 1. Organic Wave Distortion (Liquid screen feel)
      float wave = sin(uv.y * 4.0 + iTime * 1.2) * 0.05;
      uv.x += wave;
      
      // 2. Divide screen into horizontal Marquee Tabs
      float rows = 12.0; 
      vec2 grid = uv * vec2(1.0, rows);
      float id = floor(grid.y);
      
      // 3. Scrolling Math (Alternate direction and slight speed variation per row)
      float dir = mod(id, 2.0) == 0.0 ? 1.0 : -1.0;
      float speed = 2.0 + mod(id, 3.0) * 0.5; 
      grid.x += iTime * speed * dir;
      
      // 4. Repeat Word Infinitely
      float repeatX = 8.0; 
      grid.x = mod(grid.x, repeatX) - repeatX * 0.5;
      
      // 5. Center Y in the row
      grid.y = fract(grid.y) - 0.5;
      
      // 6. Draw Text
      float d = mapSalesJi(grid * 2.0); 
      d /= 2.0; 
      
      // 7. Brutalist Black & White Alternating Rows
      float isAltRow = mod(id, 2.0); 
      vec3 bgColor = mix(vec3(0.05), vec3(0.95), isAltRow); // Off-black / Off-white
      vec3 textColor = mix(vec3(1.0), vec3(0.0), isAltRow);
      
      // Anti-alias text edges
      float thickness = 0.05;
      float textMask = smoothstep(thickness, thickness - 0.015, d);
      
      // Blend Text over Background
      vec3 col = mix(bgColor, textColor, textMask);
      
      // 8. Tab Borders
      float distToEdge = 0.5 - abs(grid.y); 
      float border = smoothstep(0.05, 0.0, distToEdge);
      col = mix(col, textColor, border); // Add borders using the contrasting text color
      
      // 9. Subtle Edge Shadow (Vignette)
      float vignette = smoothstep(1.2, 0.2, length(uv));
      col *= mix(0.6, 1.0, vignette);

      gl_FragColor = vec4(col, 1.0);
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
      />
    </mesh>
  );
};

export default function SalesJiMarqueeShader() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "#000",
      }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
