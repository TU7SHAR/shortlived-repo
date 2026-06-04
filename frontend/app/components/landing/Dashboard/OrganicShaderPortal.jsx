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

  // --- NOISE FUNCTIONS ---
  vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(.1031,.11369,.13787));
      p3 += dot(p3, p3.yxz+19.19);
      return -1.0 + 2.0 * fract(vec3(p3.x+p3.y, p3.x+p3.z, p3.y+p3.z)*p3.zyx);
  }
  
  float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      
      vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
      vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
      
      return dot(vec4(31.316), n);
  }

  vec4 extractAlpha(vec3 colorIn) {
      vec4 colorOut;
      float maxValue = min(max(max(colorIn.r, colorIn.g), colorIn.b), 1.0);
      if (maxValue > 1e-5) {
          colorOut.rgb = colorIn.rgb * (1.0 / maxValue);
          colorOut.a = maxValue;
      } else {
          colorOut = vec4(0.0);
      }
      return colorOut;
  }

  #define time iTime
  
  // 1. CHANGED TO PURE WHITE
  const vec3 color1 = vec3(1.0, 1.0, 1.0); 
  const vec3 color2 = vec3(1.0, 1.0, 1.0); 
  const vec3 color3 = vec3(1.0, 1.0, 1.0); 
  
  // 2. MADE THE HALO BIGGER (Was 0.5)
  const float innerRadius = 0.75; 
  const float noiseScale = 0.1;

  float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
  }
  float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
  }

  void draw( out vec4 _FragColor, in vec2 vUv ) {
      vec2 uv = vUv;
      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float v0, v1, v2, v3, cl;
      float r0, d0, n0;
      float r, d;
      
      // 3. SLOWER DISTORTION: Reduced the time multipliers from 1.5/1.1 down to 0.4/0.3
      float organicShape = sin(ang * 3.0 + time * 0.4) * 0.12 + cos(ang * 4.0 - time * 0.3) * 0.08;
      
      // Also slowed down the noise movement slightly
      n0 = snoise3( vec3(uv * noiseScale, time * 0.2) ) * 0.5 + 0.5;
      r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      r0 += organicShape; 
      
      d0 = distance(uv, r0 / len * uv);
      v0 = light1(1.0, 10.0, d0);
      v0 *= smoothstep(r0 * 1.05, r0, len);
      cl = cos(ang + time * 2.0) * 0.5 + 0.5;
      
      float a = time * -1.0;
      vec2 posDir = vec2(cos(a), sin(a));
      
      // Must match the slower distortion speeds above so the highlight tracks correctly
      float hOrganic = sin(a * 3.0 + time * 0.4) * 0.12 + cos(a * 4.0 - time * 0.3) * 0.08;
      float hN0 = snoise3( vec3(posDir * noiseScale, time * 0.2) ) * 0.5 + 0.5;
      float hR0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), hN0) + hOrganic;
      
      vec2 pos = posDir * hR0; 
      d = distance(uv, pos);
      v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0 , d0);
      
      v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5) + organicShape, len);
      v3 = smoothstep(innerRadius + organicShape, mix(innerRadius, 1.0, 0.5) + organicShape, len);
      
      vec3 c = mix(color1, color2, cl);
      vec3 col = mix(color1, color2, cl);
      col = mix(color3, col, v0);
      col = (col + v1) * v2 * v3;
      col.rgb = clamp(col.rgb, 0.0, 1.0);
      
      _FragColor = extractAlpha(col);
  }

  void main() {
      vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
      vec4 col;
      draw(col, uv);
      gl_FragColor = vec4(mix(vec3(0.0), col.rgb, col.a), 1.0);
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

export default function OrganicPortalShader() {
  return (
    // 4. ADDED FIXED FULL-SCREEN STYLES HERE
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
