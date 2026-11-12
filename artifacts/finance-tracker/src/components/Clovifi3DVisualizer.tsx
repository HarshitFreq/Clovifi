import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Clovifi3DVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });

    const getDPR = () => Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(getDPR());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.0);

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10.0);
    camera.lookAt(0, 0, 0);

    // --- Mouse & Interactive Subtle Breeze ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- 3D Slow, Low-Contrast Raindrop Setup ---
    // 4,500 soft, slow-falling translucent droplets
    const particleCount = 4500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const properties = new Float32Array(particleCount * 4); // x: size, y: aspect stretch, z: opacity, w: seed

    for (let i = 0; i < particleCount; i++) {
      // 3D volume distribution
      positions[i * 3 + 0] = (Math.random() - 0.5) * 26.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14.0;

      // Slow, peaceful fall speed: 0.85 to 1.95 units/sec (gentle tranquil drift)
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 1] = 0.85 + Math.random() * 1.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      // Properties:
      // x: size (large soft droplet: 40 to 80 px)
      properties[i * 4 + 0] = 42.0 + Math.random() * 42.0;
      // y: aspect stretch
      properties[i * 4 + 1] = 1.4 + Math.random() * 1.5;
      // z: soft opacity (low-contrast, subtle: 0.25 to 0.55)
      properties[i * 4 + 2] = 0.25 + Math.random() * 0.3;
      // w: random phase
      properties[i * 4 + 3] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute("aProps", new THREE.BufferAttribute(properties, 4));

    // --- Vertex Shader: Slow Serene 3D Rainfall ---
    const vertexShader = `
      attribute vec3 aVelocity;
      attribute vec4 aProps;

      uniform float uTime;
      uniform float uDPR;
      uniform vec2 uMouse;

      varying vec4 vProps;
      varying float vDist;
      varying float vSeed;

      void main() {
        vProps = aProps;
        vSeed = aProps.w;

        // Total vertical rainfall span: 26 units (-13 to +13)
        float spanY = 26.0;
        // Slow downward drift
        float fallDistance = position.y - uTime * aVelocity.y;
        
        // Wrap smoothly from top (+13) to bottom (-13)
        float curY = mod(fallDistance + 13.0, spanY) - 13.0;

        // Slow, gentle horizontal ambient sway
        float windSway = sin(uTime * 0.6 + curY * 0.2 + aProps.w * 6.28) * 0.25;
        float mouseWind = uMouse.x * 0.6;
        float curX = position.x + windSway + mouseWind * (0.4 + curY * 0.03);
        float curZ = position.z;

        vec3 p = vec3(curX, curY, curZ);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vDist = -mvPos.z;

        // Soft particle sizing with gentle breathing
        float size = aProps.x * (1.0 + 0.08 * sin(uTime * 1.5 + aProps.w * 10.0));
        gl_PointSize = (size * uDPR * 24.0) / max(vDist, 1.2);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    // --- Fragment Shader: Muted, Low-Contrast Droplet Streaks ---
    const fragmentShader = `
      precision highp float;

      uniform vec3 uColorHead; // Muted soft emerald
      uniform vec3 uColorTail; // Soft dark teal mist
      uniform vec3 uColorGlow; // Faint gentle green glow

      varying vec4 vProps;
      varying float vDist;
      varying float vSeed;

      void main() {
        vec2 p = gl_PointCoord;

        // Horizontal distance from center axis
        float dx = abs(p.x - 0.5) * 2.0;

        // Soft teardrop width profile: narrow at top, round bead at bottom
        float widthProfile = mix(0.14, 0.94, smoothstep(0.05, 0.88, p.y));
        float normDistX = dx / max(widthProfile, 0.05);

        // Rounded droplet head at the bottom
        float beadDist = length(vec2(dx * 0.85, max(0.0, p.y - 0.85) * 5.0));
        if (normDistX > 1.0 || beadDist > 1.0 || p.y < 0.03) discard;

        // Soft core along center without harsh burning highlights
        float core = max(0.0, 1.0 - normDistX * 2.0);
        // Linear soft vertical gradient (low contrast, no harsh exponential cutoff)
        float intensity = mix(0.15, 0.85, p.y);

        // Low-contrast, muted chromatic blend
        vec3 col = mix(uColorTail, uColorHead, intensity);
        col += uColorGlow * core * 0.35; // gentle subtle glow, no blinding flare

        // Low-contrast, soft translucent alpha
        float alpha = (1.0 - normDistX) * intensity * vProps.z * 0.65;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    // Muted, low-contrast, low-brightness colors
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDPR: { value: getDPR() },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColorHead: { value: new THREE.Vector3(0.18, 0.55, 0.36) }, // Soft muted moss green
        uColorTail: { value: new THREE.Vector3(0.10, 0.30, 0.35) }, // Dark subtle aqua-teal
        uColorGlow: { value: new THREE.Vector3(0.28, 0.62, 0.46) }, // Gentle pastel green glow
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- Window Resize Handler ---
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(getDPR());
      renderer.setSize(w, h);
      material.uniforms.uDPR.value = getDPR();
    };
    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.03;
      mouse.y += (mouse.targetY - mouse.y) * 0.03;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      material.uniforms.uTime.value = elapsed;

      // Subtle, gentle camera drift
      camera.position.x = mouse.x * 0.4;
      camera.position.y = mouse.y * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
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
        opacity: 0.48, // Reduced overall opacity for calm, subtle background presence
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
