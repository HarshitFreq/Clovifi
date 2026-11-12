import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Color palettes inspired by 3d_Portfolio with Frutiger Aero Clovifi emerald accents
const CLOVIFI_PALETTES = [
  {
    name: "Clovifi Emerald",
    primary: new THREE.Vector3(0.15, 0.92, 0.48),    // Lush Emerald
    secondary: new THREE.Vector3(0.22, 0.78, 0.98),  // Sky Aqua
    highlight: new THREE.Vector3(0.96, 0.92, 0.65),  // Golden Sunlight
  },
  {
    name: "Cyber Shamrock",
    primary: new THREE.Vector3(0.0, 1.0, 0.53),      // Acid Mint
    secondary: new THREE.Vector3(0.85, 1.0, 0.22),   // Neon Lime
    highlight: new THREE.Vector3(0.92, 1.0, 0.85),   // Radioactive White
  },
  {
    name: "Deep Ocean",
    primary: new THREE.Vector3(0.2, 0.8, 0.85),      // Turquoise
    secondary: new THREE.Vector3(0.65, 0.5, 1.0),    // Violet
    highlight: new THREE.Vector3(0.9, 0.95, 1.0),    // Diamond Frost
  },
];

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
    const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
    const baseCamZ = 8.6;
    camera.position.set(0, 0, baseCamZ);
    camera.lookAt(0, 0, 0);

    // Points group containing the 3-lobed clover visualizer
    const group = new THREE.Group();
    group.position.set(0, 0, -0.3);
    group.rotation.set(-0.25, 0.35, 0.1);
    group.scale.set(1.45, 1.45, 1.45);
    scene.add(group);

    // --- Mouse & Gaze Camera Tracking ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- 3-Lobed Clover Knot Particle Geometry ---
    // Inspired by 3d_Portfolio's mathematical trefoil ribbon knot SDF
    const particleCount = 28000;
    const positions = new Float32Array(particleCount * 3);
    const origins = new Float32Array(particleCount * 3);
    const ribbonOffsets = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount * 4);

    for (let i = 0; i < particleCount; i++) {
      // Parametric angle t along the 3-leaf closed loop
      const t = Math.random() * Math.PI * 2;
      const ribbonWidth = (Math.random() - 0.5) * 0.42;
      const ribbonThick = (Math.random() - 0.5) * 0.18;
      const ribbonAngle = Math.random() * Math.PI * 2;

      // Base 3-lobed clover knot spine equation
      // r(t) = 1.75 + 0.65 * cos(3t) creates the distinct 3 clover lobes
      const r = 1.75 + 0.65 * Math.cos(3.0 * t);
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      const z = 0.55 * Math.sin(3.0 * t);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      origins[i * 3 + 0] = t; // store base angle t in origin.x
      origins[i * 3 + 1] = ribbonWidth;
      origins[i * 3 + 2] = ribbonThick;

      // Tangent / ribbon vector
      ribbonOffsets[i * 3 + 0] = Math.cos(ribbonAngle);
      ribbonOffsets[i * 3 + 1] = Math.sin(ribbonAngle);
      ribbonOffsets[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      // Streaming speed along loop
      speeds[i] = 0.15 + Math.random() * 0.25;

      // Random factors for size, sparkles, and color variation
      randoms[i * 4 + 0] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aOrigin", new THREE.BufferAttribute(origins, 3));
    geometry.setAttribute("aRibbon", new THREE.BufferAttribute(ribbonOffsets, 3));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 4));

    // --- Shaders for 3D Visualizer Points ---
    const vertexShader = `
      attribute vec3 aOrigin;
      attribute vec3 aRibbon;
      attribute float aSpeed;
      attribute vec4 aRandom;

      uniform float uTime;
      uniform float uDPR;
      uniform vec2 uMouse;

      varying vec4 vRandom;
      varying float vDist;
      varying float vLobe;

      // Simplex-inspired 3D curl noise approximation
      vec3 curlNoise(vec3 p) {
        float x = sin(p.y * 3.0 + uTime * 0.4) + cos(p.z * 2.5);
        float y = sin(p.z * 3.0 + uTime * 0.3) + cos(p.x * 2.5);
        float z = sin(p.x * 3.0 + uTime * 0.5) + cos(p.y * 2.5);
        return vec3(x, y, z) * 0.12;
      }

      void main() {
        vRandom = aRandom;

        // Current streaming angle along the 3-lobed loop
        float t = aOrigin.x + uTime * aSpeed * 0.35;
        float ribbonW = aOrigin.y;
        float ribbonH = aOrigin.z;

        // 3-lobed knot spine: 3 distinct clover lobes via cos(3.0 * t)
        float lobePulse = 1.0 + 0.04 * sin(uTime * 1.8 + t * 2.0);
        float r = (1.75 + 0.65 * cos(3.0 * t)) * lobePulse;
        
        // Dynamic Mobius twist along ribbon path
        float twist = t * 1.5 + uTime * 0.25;
        vec2 ribbonOffset = vec2(
          cos(twist) * ribbonW - sin(twist) * ribbonH,
          sin(twist) * ribbonW + cos(twist) * ribbonH
        );

        // Calculate 3D position
        vec3 p = vec3(
          r * cos(t) + ribbonOffset.x * cos(t),
          r * sin(t) + ribbonOffset.x * sin(t),
          0.55 * sin(3.0 * t) + ribbonOffset.y
        );

        // Add delicate curl noise turbulence
        p += curlNoise(p * 0.65) * mix(0.04, 0.14, aRandom.z);

        // Interactive mouse tilt displacement
        p.xy += uMouse * 0.22 * sin(length(p) * 2.0 - uTime);

        vLobe = 0.5 + 0.5 * cos(3.0 * t);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vDist = -mvPos.z;

        // Point size scaling with perspective and delicate sparkling
        float pulse = 0.85 + 0.35 * sin(uTime * 3.5 + aRandom.x * 20.0);
        gl_PointSize = (18.0 * uDPR * pulse) / max(vDist, 1.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const fragmentShader = `
      precision highp float;

      uniform float uTime;
      uniform vec3 uColorPrimary;
      uniform vec3 uColorSecondary;
      uniform vec3 uColorHighlight;

      varying vec4 vRandom;
      varying float vDist;
      varying float vLobe;

      void main() {
        // Soft round sprite with exponential radial glow
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        float soft = smoothstep(0.5, 0.05, dist);
        float core = smoothstep(0.2, 0.0, dist);

        // Multi-harmonic color blending between primary emerald, aqua secondary, and gold highlight
        vec3 col = mix(uColorPrimary, uColorSecondary, vLobe);
        col = mix(col, uColorHighlight, pow(vRandom.y, 4.0) * 0.7);

        // Dynamic sparkle dancing with time
        float sparkle = 0.85 + 0.5 * sin(uTime * 4.0 + vRandom.x * 30.0 + vRandom.w * 15.0);
        col *= sparkle;
        col += uColorHighlight * core * 0.45; // glowing center

        float alpha = soft * mix(0.35, 0.95, vRandom.z);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    const activePalette = CLOVIFI_PALETTES[0];
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDPR: { value: getDPR() },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColorPrimary: { value: activePalette.primary },
        uColorSecondary: { value: activePalette.secondary },
        uColorHighlight: { value: activePalette.highlight },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(geometry, material);
    group.add(pointsMesh);

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

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      material.uniforms.uTime.value = elapsed;

      // Interactive 3D Gaze camera drift
      camera.position.x = mouse.x * 0.8;
      camera.position.y = mouse.y * 0.6;
      camera.lookAt(0, 0, 0);

      // Organic group rotation: continuous slow yaw and pitch
      group.rotation.y += 0.22 * delta;
      group.rotation.x = -0.25 + 0.15 * Math.sin(elapsed * 0.35) + mouse.y * 0.2;
      group.rotation.z = 0.1 * Math.cos(elapsed * 0.25) - mouse.x * 0.15;

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
        opacity: 0.85,
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
