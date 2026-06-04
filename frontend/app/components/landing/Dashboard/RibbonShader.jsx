"use client";

import { useRef, useEffect } from "react";

export default function RibbonShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { alpha: false }); // alpha: false for deeper blacks
    if (!gl) return;

    const vsSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    // The math here creates the "Extravagant yet Minimal" look
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        // Center and normalize coordinates based on screen aspect ratio
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        
        // Slow down the time for a luxurious, premium feel
        float t = u_time * 0.2;
        
        // Complex domain warping (The "Extravagant" part)
        // This math folds the coordinates over themselves smoothly
        vec2 p = uv;
        for(float i = 1.0; i < 6.0; i++) {
            vec2 newp = p;
            newp.x += 0.4 / i * sin(i * p.y + t + 0.3) * 1.5;
            newp.y += 0.4 / i * cos(i * p.x + t + 0.3) * 1.5;
            p = newp;
        }
        
        // The "Minimal" part: Create razor-thin glowing curves
        // Dividing by the absolute value creates intense, crisp hotspots
        float d = sin(p.x * 2.0) + cos(p.y * 2.0);
        float glow = 0.015 / abs(d);
        
        // Clamp the extreme brights and add a vignette so the edges fade to pure black
        glow = clamp(glow, 0.0, 1.0);
        float vignette = smoothstep(2.5, 0.2, length(uv));
        
        // Pure crisp white/silver glow (Multiplied by 0.5 to keep it subtle behind text)
        vec3 color = vec3(1.0) * glow * vignette * 0.5;
        
        gl_FragColor = vec4(color, 1.0);
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
