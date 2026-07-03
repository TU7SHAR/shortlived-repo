"use client";

import { useRef, useEffect } from "react";

export default function LiquidSilkShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    // Pass alpha: true to enable canvas transparency
    const gl = canvas.getContext("webgl", { alpha: true });
    if (!gl) return;

    const vsSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.y;
        
        vec2 p = uv;
        for(float i = 1.0; i < 4.0; i++) {
            vec2 newp = p;
            newp.x += 0.6 / i * sin(i * p.y + u_time * 0.2 + 0.3) + 0.5;
            newp.y += 0.6 / i * cos(i * p.x + u_time * 0.2 + 0.3) - 0.5;
            p = newp;
        }
        
        float intensity = 0.5 * sin(3.0 * p.x) + 0.5;
        
        // Base color: Soft neutral grey/dark shade
        vec3 silkColor = vec3(0.12); 
        
        // Dynamically scale alpha based on wave intensity so the gaps are transparent
        float alpha = intensity * 0.4; 
        
        gl_FragColor = vec4(silkColor * alpha, alpha);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexVertexAttribArray &&
      gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    let animationFrameId;

    const render = (time) => {
      if (
        canvas.width !== window.innerWidth ||
        canvas.height !== window.innerHeight
      ) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);

      // Clear with 0.0 alpha (Fully transparent)
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time * 0.001);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
