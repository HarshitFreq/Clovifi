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

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.active = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.45;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // --- Connected Dots Constellation Nodes ---
    // Scaled for performance on mobile (65 nodes) vs desktop (140 nodes)
    const isMobile = width < 768;
    const NODE_COUNT = isMobile ? 65 : 140;
    const BOUND_X = width * (isMobile ? 0.65 : 0.55);
    const BOUND_Y = height * (isMobile ? 0.65 : 0.55);
    const BOUND_Z = isMobile ? 260 : 340;
    const FOV = isMobile ? 480 : 580; // Perspective distance

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

    // --- Main Animation Loop ---
    let animId: number;
    let time = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      time += 0.016;

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
      const MAX_DIST_3D = isMobile ? 115 : 145;
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
            const lineAlpha = (1 - dist / MAX_DIST_3D) * 0.40 * Math.min(p1.scale, p2.scale);

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
          const MOUSE_RADIUS = isMobile ? 135 : 175;

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
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
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
