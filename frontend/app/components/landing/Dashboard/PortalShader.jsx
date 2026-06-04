"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const FractalPortal = () => {
  const materialRef = useRef();

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.iTime.value += delta;
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
        transparent={true}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          void main() {
            // Simply project the flat plane to the screen, no varying needed
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `}
        fragmentShader={`
          precision highp float;
          uniform vec3 iResolution;
          uniform float iTime;

          vec3 palette( float t ) {
              vec3 a = vec3(0.5, 0.5, 0.5);
              vec3 b = vec3(0.5, 0.5, 0.5);
              vec3 c = vec3(1.0, 1.0, 1.0);
              vec3 d = vec3(0.263, 0.416, 0.557);
              return a + b * cos( 6.28318 * (c * t + d) );
          }

          void main() {
              // Ensure we don't divide by zero before the canvas mounts
              if (iResolution.y == 0.0) {
                  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                  return;
              }

              vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
              vec2 uv0 = uv; 
              vec3 finalColor = vec3(0.0);

              for (float i = 0.0; i < 4.0; i++) {
                  uv = fract(uv * 1.5) - 0.5;
                  float d = length(uv) * exp(-length(uv0));
                  vec3 col = palette(length(uv0) + i * 0.4 + iTime * 0.4);
                  
                  d = sin(d * 8.0 + iTime) / 8.0;
                  d = abs(d);
                  d = pow(0.01 / d, 1.2);
                  
                  finalColor += col * d;
              }
              
              gl_FragColor = vec4(finalColor * 0.4, 1.0);
          }
        `}
      />
    </mesh>
  );
};

export default function PortalShader() {
  return (
    // Explicit sizing w-screen h-screen ensures the WebGL canvas initializes correctly
    <div className="fixed inset-0 w-screen h-screen z-0 bg-[#050505] overflow-hidden block">
      <Canvas
        orthographic
        camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <FractalPortal />
      </Canvas>
    </div>
  );
}
