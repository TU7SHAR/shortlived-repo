"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "../components/landing/Navbar";
import { Mail, MapPin, Send, CheckCircle2 } from "lucide-react";
import RibbonShader from "../components/landing/Dashboard/RibbonShader";
import { siteConfig } from "@/app/utils/config";

export default function ContactPage() {
  const container = useRef(null);
  const canvasRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");

  // --- WEBGL SHADER (Subtle, elegant background motion) ---
  useEffect(() => {
    document.title = `Contact | ${siteConfig.name}`;
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    const vsSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      float random(in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise(in vec2 st) {
          vec2 i = floor(st); vec2 f = fract(st);
          float a = random(i); float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(in vec2 st) {
          float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
          for (int i = 0; i < 4; ++i) { v += a * noise(st); st = rot * st * 2.0 + shift; a *= 0.5; }
          return v;
      }
      void main() {
          vec2 st = gl_FragCoord.xy/u_resolution.xy * 2.0;
          vec2 q = vec2(0.);
          q.x = fbm(st + 0.00 * u_time); q.y = fbm(st + vec2(1.0));
          vec2 r = vec2(0.);
          r.x = fbm(st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time); r.y = fbm(st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);
          float f = fbm(st+r);
          // Very dark, elegant output to match the bg-black theme
          float colorBase = (f * f * f + 0.6 * f * f + 0.5 * f) * 0.08;
          gl_FragColor = vec4(vec3(colorBase), 1.0);
      }
    `;

    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(vsSource, gl.VERTEX_SHADER));
    gl.attachShader(program, compileShader(fsSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "u_time");
    const resLoc = gl.getUniformLocation(program, "u_resolution");

    let startTime = Date.now();
    let animationFrameId;

    const render = () => {
      gl.uniform1f(timeLoc, (Date.now() - startTime) * 0.001);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- GSAP ANIMATIONS (Matches Pricing Page) ---
  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.fromTo(
        ".contact-header",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" },
      ).fromTo(
        ".contact-card",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)" },
        "-=0.4",
      );
    },
    { scope: container, dependencies: [] },
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div
      ref={container}
      className="bg-black text-white min-h-screen relative selection:bg-white selection:text-black"
    >
      {/* Background Shader */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 w-full h-full opacity-50 pointer-events-none"
      />
      <RibbonShader />
      <Navbar />

      <main className="pt-40 px-6 max-w-7xl mx-auto pb-32 relative z-10 flex flex-col items-center">
        {/* --- HEADER (Matches 'Simple pricing.') --- */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="contact-header text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
            Get in touch.
          </h1>
          <p className="contact-header text-xl text-zinc-400 font-medium leading-relaxed mb-10">
            Need enterprise limits or custom infrastructure? Our team is ready
            to scale with you.
          </p>

          <div className="contact-header flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-bold text-zinc-400">
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-white/10">
              <Mail size={16} className="text-white" /> hello@salesji.com
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-white/10">
              <MapPin size={16} className="text-white" /> Mohali, Punjab
            </div>
          </div>
        </div>

        {/* --- CONTACT FORM CARD (Matches Pricing Cards) --- */}
        <div className="contact-card w-full max-w-2xl bg-zinc-900 p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
          <h3 className="text-2xl font-bold mb-8">Send a message</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-600 font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-all placeholder:text-zinc-600 font-medium"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-widest">
                Message
              </label>
              <textarea
                required
                rows="4"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-white transition-all resize-none placeholder:text-zinc-600 font-medium"
                placeholder="How can we help you scale?"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`w-full py-4 rounded-xl font-bold text-center transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                status === "success"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {status === "idle" && (
                <>
                  <Send size={18} /> Send Message
                </>
              )}
              {status === "loading" && "Sending..."}
              {status === "success" && (
                <>
                  <CheckCircle2 size={18} /> Message Sent
                </>
              )}
              {status === "error" && "Error - Try Again"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
