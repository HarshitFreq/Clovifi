import React, { useEffect, useRef } from "react";

interface Node3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  glow: string;
  phase: number;
  pulseSpeed: number;
}

interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
}

interface Rocket {
  x: number;
  y: number;
  z: number;
  vy: number;
  targetY: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
}

export default function Clovifi3DVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // --- Interactive Mouse State ---
    const mouse = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      active: false,
    };

    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.45;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    // --- 1. Connected Dots Constellation Nodes ---
    // 130 3D nodes drifting in space
    const NODE_COUNT = 130;
    const BOUND_X = width * 0.55;
    const BOUND_Y = height * 0.55;
    const BOUND_Z = 320;
    const FOV = 580; // Perspective distance

    // Clovifi themed emerald, mint, cyan, and starlight white palette
    const nodePalette = [
      { color: "rgba(74, 222, 128, 0.95)", glow: "rgba(74, 222, 128, 0.45)" }, // Emerald
      { color: "rgba(110, 231, 183, 0.95)", glow: "rgba(110, 231, 183, 0.45)" }, // Mint
      { color: "rgba(56, 189, 248, 0.90)", glow: "rgba(56, 189, 248, 0.40)" }, // Cosmic Cyan
      { color: "rgba(240, 253, 244, 0.98)", glow: "rgba(240, 253, 244, 0.50)" }, // Starlight White
    ];

    const nodes: Node3D[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const p = nodePalette[Math.floor(Math.random() * nodePalette.length)];
      nodes.push({
        x: (Math.random() - 0.5) * BOUND_X * 2,
        y: (Math.random() - 0.5) * BOUND_Y * 2,
        z: (Math.random() - 0.5) * BOUND_Z * 2,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        vz: (Math.random() - 0.5) * 0.35,
        radius: 1.8 + Math.random() * 2.2,
        color: p.color,
        glow: p.glow,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.8 + Math.random() * 1.5,
      });
    }

    // --- 2. Fireworks System (Classic macOS / iTunes Visualizer style) ---
    const sparks: Spark[] = [];
    const rockets: Rocket[] = [];

    const sparkPalette = [
      "#4ade80", // Emerald
      "#6ee7b7", // Mint
      "#38bdf8", // Cyan
      "#fef08a", // Warm Star Gold
      "#ffffff", // White Sparkle
    ];

    const createFireworkBurst = (originX: number, originY: number, originZ = 0, count = 45) => {
      const baseColor = sparkPalette[Math.floor(Math.random() * sparkPalette.length)];
      for (let i = 0; i < count; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 2.0 + Math.random() * 4.8;

        const vx = Math.sin(phi) * Math.cos(theta) * speed;
        const vy = Math.sin(phi) * Math.sin(theta) * speed * 0.85;
        const vz = Math.cos(phi) * speed * 0.7;

        sparks.push({
          x: originX,
          y: originY,
          z: originZ,
          vx,
          vy,
          vz,
          alpha: 1.0,
          decay: 0.012 + Math.random() * 0.014,
          size: 1.4 + Math.random() * 2.0,
          color: Math.random() < 0.4 ? "#ffffff" : baseColor,
          trail: [],
        });
      }
    };

    // Launch ambient rocket
    const launchAmbientRocket = () => {
      const rx = (Math.random() - 0.5) * (width * 0.7);
      const rz = (Math.random() - 0.5) * 200;
      rockets.push({
        x: rx,
        y: height * 0.55 + 50,
        z: rz,
        vy: -5.5 - Math.random() * 3.5,
        targetY: -height * 0.35 + Math.random() * (height * 0.4),
        color: sparkPalette[Math.floor(Math.random() * sparkPalette.length)],
        trail: [],
      });
    };

    // User Interactive Click: Spawn Firework at cursor
    const handlePointerDown = (e: MouseEvent) => {
      // Don't intercept clicks on buttons, links, inputs
      if ((e.target as HTMLElement)?.closest("button, a, input, select, textarea")) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - width * 0.5;
      const clickY = e.clientY - rect.top - height * 0.5;
      createFireworkBurst(clickX, clickY, 0, 50);
    };
    window.addEventListener("pointerdown", handlePointerDown);

    // Periodic ambient fireworks timer (every 2.8 - 4.5s)
    let lastRocketTime = performance.now();
    let nextRocketDelay = 2200;

    // --- Main Animation Loop ---
    let animId: number;
    let time = 0;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      time += 0.016;

      // Clear with soft alpha trail for pyrotechnic persistence
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      // 3D Parallax Tilt Angles based on cursor
      const rotY = ((mouse.x / width) * 2 - 1) * 0.22;
      const rotX = -((mouse.y / height) * 2 - 1) * 0.18;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Center offset
      const cx = width * 0.5;
      const cy = height * 0.5;

      // Project 3D point to 2D screen coordinates
      const project = (px: number, py: number, pz: number) => {
        // Rotate around Y
        const x1 = px * cosY + pz * sinY;
        const z1 = -px * sinY + pz * cosY;
        // Rotate around X
        const y1 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        const scale = FOV / (FOV + z2);
        return {
          x: cx + x1 * scale,
          y: cy + y1 * scale,
          z: z2,
          scale,
          visible: scale > 0.1 && scale < 2.5,
        };
      };

      // ── 1. Update and Project Nodes ──
      const projectedNodes: {
        sx: number;
        sy: number;
        z: number;
        scale: number;
        node: Node3D;
      }[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Drift motion
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        // Wrap around boundaries
        const bx = BOUND_X + 80;
        const by = BOUND_Y + 80;
        const bz = BOUND_Z;
        if (n.x < -bx) n.x = bx;
        if (n.x > bx) n.x = -bx;
        if (n.y < -by) n.y = by;
        if (n.y > by) n.y = -by;
        if (n.z < -bz) n.z = bz;
        if (n.z > bz) n.z = -bz;

        const proj = project(n.x, n.y, n.z);
        if (proj.visible) {
          projectedNodes.push({
            sx: proj.x,
            sy: proj.y,
            z: proj.z,
            scale: proj.scale,
            node: n,
          });
        }
      }

      // Additive blending for luminous glow
      ctx.globalCompositeOperation = "lighter";

      // ── 2. Draw Constellation Connection Lines ──
      const MAX_DIST_3D = 135;
      const MAX_DIST_SQ = MAX_DIST_3D * MAX_DIST_3D;

      for (let i = 0; i < projectedNodes.length; i++) {
        const p1 = projectedNodes[i];
        const n1 = p1.node;

        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p2 = projectedNodes[j];
          const n2 = p2.node;

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dz = n1.z - n2.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < MAX_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / MAX_DIST_3D) * 0.38 * Math.min(p1.scale, p2.scale);

            if (lineAlpha > 0.015) {
              ctx.beginPath();
              ctx.moveTo(p1.sx, p1.sy);
              ctx.lineTo(p2.sx, p2.sy);
              ctx.strokeStyle = `rgba(74, 222, 128, ${lineAlpha.toFixed(3)})`;
              ctx.lineWidth = Math.max(0.6, 1.1 * Math.min(p1.scale, p2.scale));
              ctx.stroke();
            }
          }
        }

        // Connection to Interactive Mouse Cursor
        if (mouse.active) {
          const mdx = p1.sx - mouse.x;
          const mdy = p1.sy - mouse.y;
          const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
          const MOUSE_RADIUS = 165;

          if (mouseDist < MOUSE_RADIUS) {
            const mouseAlpha = (1 - mouseDist / MOUSE_RADIUS) * 0.65;
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(167, 243, 208, ${mouseAlpha.toFixed(3)})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();

            // Gentle elastic pull towards cursor
            n1.vx += (mouse.x - cx - n1.x) * 0.00008;
            n1.vy += (mouse.y - cy - n1.y) * 0.00008;
          }
        }
      }

      // ── 3. Draw Constellation Dot Nodes ──
      for (let i = 0; i < projectedNodes.length; i++) {
        const { sx, sy, scale, node: n } = projectedNodes[i];
        const pulse = 0.85 + 0.15 * Math.sin(time * n.pulseSpeed + n.phase);
        const r = Math.max(1.0, n.radius * scale * pulse);

        // Soft outer radial glow halo
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = n.glow;
        ctx.fill();

        // Crisp luminous core dot
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      // ── 4. Ambient Rocket Launcher ──
      if (now - lastRocketTime > nextRocketDelay) {
        lastRocketTime = now;
        nextRocketDelay = 2600 + Math.random() * 2200;
        launchAmbientRocket();
      }

      // ── 5. Update & Draw Rockets ──
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy *= 0.985; // Slow down near apex

        const proj = project(r.x, r.y, r.z);
        if (proj.visible) {
          // Add trail
          r.trail.push({ x: proj.x, y: proj.y, alpha: 0.8 });
          if (r.trail.length > 8) r.trail.shift();

          // Render trail
          for (let t = 0; t < r.trail.length; t++) {
            const pt = r.trail[t];
            pt.alpha *= 0.82;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5 * proj.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(254, 240, 138, ${pt.alpha})`;
            ctx.fill();
          }

          // Rocket head spark
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 2.8 * proj.scale, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }

        // Apex reached: EXPLODE into fireworks burst!
        if (r.y <= r.targetY || r.vy > -1.0) {
          createFireworkBurst(r.x, r.y, r.z, 38 + Math.floor(Math.random() * 18));
          rockets.splice(i, 1);
        }
      }

      // ── 6. Update & Draw Fireworks Sparks ──
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        // Physics: velocity, gravity, drag
        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;
        s.vy += 0.045; // Gentle downward gravity
        s.vx *= 0.978;
        s.vy *= 0.978;
        s.vz *= 0.978;

        s.alpha -= s.decay;

        if (s.alpha <= 0.02) {
          sparks.splice(i, 1);
          continue;
        }

        const proj = project(s.x, s.y, s.z);
        if (proj.visible) {
          // Trail
          s.trail.push({ x: proj.x, y: proj.y, alpha: s.alpha });
          if (s.trail.length > 5) s.trail.shift();

          // Spark trail
          for (let t = 0; t < s.trail.length; t++) {
            const pt = s.trail[t];
            pt.alpha *= 0.84;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(0.8, s.size * 0.6 * proj.scale), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167, 243, 208, ${pt.alpha * 0.4})`;
            ctx.fill();
          }

          // Spark core
          const sparkRadius = Math.max(1.0, s.size * proj.scale);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, sparkRadius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 222, 128, ${s.alpha * 0.45})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(proj.x, proj.y, sparkRadius, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();

          // Connect nearby sparks to each other for pyrotechnic constellation blossoms
          if (i > 0 && i % 3 === 0) {
            const nextSpark = sparks[i - 1];
            const dx = s.x - nextSpark.x;
            const dy = s.y - nextSpark.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 45) {
              const pNext = project(nextSpark.x, nextSpark.y, nextSpark.z);
              if (pNext.visible) {
                ctx.beginPath();
                ctx.moveTo(proj.x, proj.y);
                ctx.lineTo(pNext.x, pNext.y);
                ctx.strokeStyle = `rgba(254, 240, 138, ${(s.alpha * 0.35).toFixed(3)})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
              }
            }
          }
        }
      }

      // Reset composite operation
      ctx.globalCompositeOperation = "source-over";
    };

    animId = requestAnimationFrame(render);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.72,
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
