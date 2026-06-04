"use client";

import { useRef, useEffect } from "react";

export default function RetroGridShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // --- Vertex Shader ---
    const vsSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    // --- Fragment Shader ---
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        // Normalize coordinates (-1.0 to 1.0)
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        // Define where the horizon sits on the screen
        float horizon = -0.1;
        vec3 color = vec3(0.0);
        
        // Only render the grid below the horizon
        if (uv.y < horizon) {
            // Pseudo-3D Perspective depth calculation
            float depth = 1.0 / abs(uv.y - horizon);
            vec2 pos = vec2(uv.x * depth, depth);
            
            // Move the grid towards the camera
            pos.y -= u_time * 1.5;
            
            // Scale the grid density
            pos *= 2.5;
            
            // Generate the grid lines using fract
            vec2 grid = abs(fract(pos - 0.5) - 0.5);
            
            // Scale line thickness by depth to prevent ugly moire patterns in the distance
            vec2 thickness = vec2(0.03) * depth;
            float lineX = smoothstep(thickness.x, 0.0, grid.x);
            float lineY = smoothstep(thickness.y, 0.0, grid.y);
            float lines = max(lineX, lineY);
            
            // --- COLOR UPDATE: Pure White Grid ---
            vec3 gridColor = vec3(1.0, 1.0, 1.0); 
            
            // Fade out into the darkness at the horizon (Fog effect)
            float fog = smoothstep(12.0, 0.0, depth);
            
            // --- COLOR UPDATE: Pure White Horizon Glow ---
            float horizonGlow = smoothstep(0.2, 0.0, abs(uv.y - horizon)) * 0.15;
            
            color = mix(vec3(0.0), gridColor * lines, fog);
            color += vec3(1.0, 1.0, 1.0) * horizonGlow * fog;
        }
        
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
