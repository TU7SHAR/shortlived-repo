"use client";

import { useEffect, useRef } from "react";

export default function AbstractWaterfallShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");

    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Enable derivatives extension
    gl.getExtension("OES_standard_derivatives");

    // ============================================
    // Vertex Shader
    // ============================================
    const vertexShaderSource = `
      attribute vec2 a_position;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // ============================================
    // Fragment Shader
    // ============================================
    const fragmentShaderSource = `
      #extension GL_OES_standard_derivatives : enable

      precision highp float;

      uniform vec2 iResolution;
      uniform float iTime;

      const float PI = 3.141592654;
      const float TAU = 2.0 * PI;
      const float PI_2 = 0.5 * PI;

      float ray_issphere4(vec3 ro, vec3 rd, float ra) {
        float r2 = ra * ra;

        vec3 d2 = rd * rd;
        vec3 d3 = d2 * rd;
        vec3 o2 = ro * ro;
        vec3 o3 = o2 * ro;

        float ka = 1.0 / dot(d2, d2);
        float k3 = ka * dot(ro, d3);
        float k2 = ka * dot(o2, d2);
        float k1 = ka * dot(o3, rd);
        float k0 = ka * (dot(o2, o2) - r2 * r2);

        float c2 = k2 - k3 * k3;
        float c1 = k1 + 2.0 * k3 * k3 * k3 - 3.0 * k3 * k2;

        float c0 =
          k0 -
          3.0 * k3 * k3 * k3 * k3 +
          6.0 * k3 * k3 * k2 -
          4.0 * k3 * k1;

        float p = c2 * c2 + c0 / 3.0;
        float q = c2 * c2 * c2 - c2 * c0 + c1 * c1;
        float h = q * q - p * p * p;

        if (h < 0.0) return -1.0;

        float sh = sqrt(h);

        float s =
          sign(q + sh) *
          pow(abs(q + sh), 1.0 / 3.0);

        float t =
          sign(q - sh) *
          pow(abs(q - sh), 1.0 / 3.0);

        vec2 w = vec2(s + t, s - t);

        vec2 v =
          vec2(w.x + c2 * 4.0, w.y * sqrt(3.0)) *
          0.5;

        float r = length(v);

        return abs(v.y) / sqrt(r + v.x) - c1 / r - k3;
      }

      float hash(vec2 co) {
        return fract(
          sin(dot(co.xy, vec2(12.9898, 58.233))) *
          13758.5453
        );
      }

      float hash(float co) {
        return fract(sin(co * 12.9898) * 13758.5453);
      }

      float dot2(vec2 p) {
        return dot(p, p);
      }

      vec3 lines(
        vec3 F,
        vec3 P,
        float A,
        float AA,
        float T
      ) {
        const float N = 4.0;

        const vec2
          Z0 = vec2(5e-3, TAU / 6.0),
          Z1 = 0.2 * Z0;

        for (float j = 0.0; j < N; ++j) {
          vec3 p = P;
          vec3 b;

          p.x += Z0.x * j / N;

          float h0 =
            hash(vec2(floor(p.x / Z0.x + 0.5), j));

          float h1 = fract(8667.0 * h0);

          float a = A - T * (1.0 + h0);

          vec2 q = vec2(p.x, a);

          vec2 n =
            floor(vec2(p.x, a) / Z0 + 0.5);

          q -= n * Z0;

          vec2 q0 = q - vec2(0.0, Z1.y);

          vec2 q1 = q;

          q1.y =
            max(abs(q1.y) - Z1.y, 0.0);

          vec2 d =
            vec2(length(q0), length(q1)) -
            Z1.x;

          vec4 c =
            0.5 *
            (
              1.0 +
              sin(
                0.1 * T +
                TAU * h1 +
                vec4(0.0, 1.0, 8.0, 4.0)
              )
            );

          b = c.xyz * c.w;

          F +=
            exp(19.0 * (q.y - Z1.y)) *
            smoothstep(AA, -AA, d.y) *
            b;

          F +=
            smoothstep(
              AA,
              -AA,
              d.x - 0.5 * Z1.x
            ) *
            sqrt(
              0.5 *
              (
                b -
                min(0.0, d.x - 0.5 * Z1.x)
              )
            );
        }

        return F;
      }

      vec3 stars(
        vec3 F,
        vec3 P,
        float A,
        float AA,
        float T
      ) {
        const vec2 Z0 = vec2(0.1, TAU / 6.0);

        vec3 p = P;

        p.x += 0.123;

        float h0 =
          hash(
            vec2(
              floor(p.x / Z0.x + 0.5),
              0.0
            )
          );

        float h1 = fract(8667.0 * h0);

        float a = A - T * (1.5 + h0);

        vec2 q = vec2(p.x, a);

        vec2 n =
          floor(vec2(p.x, a) / Z0 + 0.5);

        q -= n * Z0;

        vec2 dq =
          abs(dFdx(q)) +
          abs(dFdy(q));

        vec3 c =
          0.5 *
          (
            1.0 +
            sin(
              7.0 * T +
              TAU * h1 +
              vec3(2.0, 1.0, 0.0)
            )
          ) *
          hash(
            0.123 * n.x +
            floor(T * 121.0)
          );

        F +=
          c.xyz *
          7e-6 /
          max(
            dot2(
              vec2(dq.y / dq.x, 1.0) * q
            ),
            1e-6
          );

        return F;
      }

      void mainImage(out vec4 O, vec2 C) {
        vec2 R = iResolution.xy;

        vec3 RO = vec3(0.0, -1.9, 0.0);

        vec3 RD =
          normalize(
            vec3(
              C - 0.5 * R,
              sqrt(2.0) * R.y
            )
          );

        vec3 F =
          3e-4 *
          vec3(1.0, 4.0, 40.0) /
          (
            dot2(
              vec2(sqrt(0.5), 1.0).yx *
              (
                (C + C - R) / R.x -
                vec2(0.0, R.y / R.x)
              )
            ) +
            2e-3
          );

        float Z =
          ray_issphere4(RO, RD, 2.0);

        float T = 0.07 * iTime + 123.0;

        vec3 P = Z * RD + RO;

        float A = atan(P.z, P.y);

        vec2 fw =
          abs(dFdx(vec2(P.x, A))) +
          abs(dFdy(vec2(P.x, A)));

        float AA =
          sqrt(2.0) * length(fw);

        F = lines(F, P, A, AA, T);

        F = stars(F, P, A, AA, T);

        F *= 4.0;

        F -= 2e-2 * vec3(2.0, 3.0, 1.0);

        // tanh replacement for WebGL1
        F =
          clamp(
            (
              exp(2.0 * F) - 1.0
            ) /
            (
              exp(2.0 * F) + 1.0
            ),
            -1.0,
            1.0
          );

        F = max(F, 0.0);

        F = sqrt(F) - 0.05;

        O = vec4(F, 1.0);
      }

      void main() {
        vec4 color;

        mainImage(color, gl_FragCoord.xy);

        gl_FragColor = color;
      }
    `;

    // ============================================
    // Shader Compiler
    // ============================================
    function compileShader(type, source) {
      const shader = gl.createShader(type);

      gl.shaderSource(shader, source);

      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));

        gl.deleteShader(shader);

        return null;
      }

      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = compileShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));

      return;
    }

    gl.useProgram(program);

    // ============================================
    // Fullscreen Quad
    // ============================================
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,

        -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // ============================================
    // Uniforms
    // ============================================
    const timeLocation = gl.getUniformLocation(program, "iTime");

    const resolutionLocation = gl.getUniformLocation(program, "iResolution");

    // ============================================
    // Resize
    // ============================================
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();

    window.addEventListener("resize", resize);

    // ============================================
    // Render Loop
    // ============================================
    let animationFrameId;

    const render = (time) => {
      gl.uniform1f(timeLocation, time * 0.001);

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />;
}
