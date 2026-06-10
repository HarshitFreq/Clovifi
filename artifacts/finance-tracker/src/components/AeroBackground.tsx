import { useEffect, useRef } from "react";

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVy: number;
  radius: number;
}

export default function AeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Subtle bubble count (15 max so we don't overdo it)
    const BUBBLE_COUNT = 15;
    const bubbles: Bubble[] = [];

    // Initialize bubbles
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const radius = Math.random() * 25 + 15; // 15px to 40px
      const baseVy = -(Math.random() * 0.4 + 0.3); // -0.3 to -0.7px/frame
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: baseVy,
        baseVy,
        radius,
      });
    }

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    // Physics & render loop
    const update = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const repelDist = 130;

      bubbles.forEach((b) => {
        // Upward drift
        b.x += b.vx;
        b.y += b.vy;

        // Damping and return to base velocity
        b.vx *= 0.95;
        b.vy = b.vy * 0.95 + b.baseVy * 0.05;

        // Cursor avoidance force
        const dx = b.x - mouse.x;
        const dy = b.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repelDist) {
          const force = (repelDist - dist) / repelDist; // 0 to 1
          const angle = Math.atan2(dy, dx);
          // Apply repulsion force
          b.vx += Math.cos(angle) * force * 0.85;
          b.vy += Math.sin(angle) * force * 0.85;
        }

        // Screen boundary wrap around
        if (b.y < -b.radius) {
          // Recycle bubble to the bottom
          b.y = height + b.radius;
          b.x = Math.random() * width;
          b.vx = (Math.random() - 0.5) * 0.3;
          b.radius = Math.random() * 25 + 15;
          b.baseVy = -(Math.random() * 0.4 + 0.3);
          b.vy = b.baseVy;
        }

        if (b.x < -b.radius * 2) {
          b.x = width + b.radius;
        } else if (b.x > width + b.radius * 2) {
          b.x = -b.radius;
        }

        // Draw bubble (Glossy Frutiger Aero design)
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

        // Highlight gradient offset to top-left
        const grad = ctx.createRadialGradient(
          b.x - b.radius * 0.28,
          b.y - b.radius * 0.28,
          b.radius * 0.05,
          b.x,
          b.y,
          b.radius
        );

        // Subtly colored translucent stops (very low opacity so it isn't distracting)
        grad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
        grad.addColorStop(0.28, "rgba(180, 240, 100, 0.03)");
        grad.addColorStop(0.8, "rgba(60, 160, 20, 0.07)");
        grad.addColorStop(0.96, "rgba(255, 255, 255, 0.09)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.12)");

        ctx.fillStyle = grad;
        ctx.fill();
      });

      animationId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0.85,
      }}
    />
  );
}
