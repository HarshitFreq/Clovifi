import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Color palettes inspired by 3d_Portfolio with rich Emerald, Aqua, and Solar Gold accents
const PALETTES = [
  {
    name: "Emerald Infinity",
    primary: new THREE.Vector3(0.12, 0.94, 0.48),    // Neon Emerald
    secondary: new THREE.Vector3(0.18, 0.82, 0.98),  // Sky Cyan
    highlight: new THREE.Vector3(0.98, 0.94, 0.68),  // Starlight Gold
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
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    const baseCamZ = 8.8;
    camera.position.set(0, 0, baseCamZ);
    camera.lookAt(0, 0, 0);

    // Group containing the 3D particle visualizer sculpture
    const group = new THREE.Group();
    group.position.set(0, 0, -0.2);
    group.rotation.set(-0.2, 0.4, 0.05);
    group.scale.set(1.4, 1.4, 1.4);
    scene.add(group);

    // --- Mouse & Gaze Camera Tracking ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- Dynamic Mobius Torus Ribbon Particle Geometry ---
    // 32,000 sparkling diamond particles distributed along an infinite Mobius loop
    const particleCount = 32000;
    const positions = new Float32Array(particleCount * 3);
    const origins = new Float32Array(particleCount * 3);
    const ribbonOffsets = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount * 4);

    for (let i = 0; i < particleCount; i++) {
      // Parametric angle t along the infinite ribbon loop
      const t = Math.random() * Math.PI * 2;
      const ribbonWidth = (Math.random() - 0.5) * 0.48;
      const ribbonThick = (Math.random() - 0.5) * 0.22;
      const ribbonAngle = Math.random() * Math.PI * 2;

      // Mobius torus knot spine equation
      const R = 2.25 + 0.42 * Math.cos(2.0 * t);
      const x = R * Math.cos(t);
      const y = R * Math.sin(t) * 0.95;
      const z = 0.85 * Math.sin(2.0 * t);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      origins[i * 3 + 0] = t; // store loop parameter t
      origins[i * 3 + 1] = ribbonWidth;
      origins[i * 3 + 2] = ribbonThick;

      ribbonOffsets[i * 3 + 0] = Math.cos(ribbonAngle);
      ribbonOffsets[i * 3 + 1] = Math.sin(ribbonAngle);
      ribbonOffsets[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      speeds[i] = 0.18 + Math.random() * 0.28;

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

    // --- Vertex Shader: Mobius Ribbon Stream & Perspective Attenuation ---
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
      varying float vPhase;

      // 3D curl noise turbulence
      vec3 curlNoise(vec3 p) {
        float x = sin(p.y * 2.8 + uTime * 0.4) + cos(p.z * 2.2);
        float y = sin(p.z * 2.8 + uTime * 0.3) + cos(p.x * 2.2);
        float z = sin(p.x * 2.8 + uTime * 0.5) + cos(p.y * 2.2);
        return vec3(x, y, z) * 0.12;
      }

      void main() {
        vRandom = aRandom;

        // Streaming along the infinite Mobius loop
        float t = aOrigin.x + uTime * aSpeed * 0.45;
        float rw = aOrigin.y;
        float rh = aOrigin.z;

        // Torus knot with organic breathing pulsation
        float scalePulse = 1.0 + 0.045 * sin(uTime * 1.5 + t * 2.0);
        float R = (2.25 + 0.42 * cos(2.0 * t)) * scalePulse;
        
        float x = R * cos(t);
        float y = R * sin(t) * 0.95;
        float z = 0.85 * sin(2.0 * t);

        // Dynamic Mobius twist
        float twist = t * 1.5 + uTime * 0.3;
        vec3 normal = vec3(
          cos(twist) * rw - sin(twist) * rh,
          sin(twist) * rw + cos(twist) * rh,
          sin(t * 3.0) * rw * 0.5
        );

        vec3 p = vec3(x, y, z) + normal;

        // Micro curl turbulence
        p += curlNoise(p * 0.5) * mix(0.04, 0.15, aRandom.z);

        // Interactive pointer responsiveness
        p.xy += uMouse * 0.22 * sin(length(p) * 1.8 - uTime * 1.2);

        vPhase = 0.5 + 0.5 * sin(2.0 * t);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vDist = -mvPos.z;

        // Diamond star sizing with perspective attenuation
        float pulse = 0.85 + 0.45 * sin(uTime * 3.8 + aRandom.x * 22.0);
        gl_PointSize = (21.0 * uDPR * pulse) / max(vDist, 1.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    // --- Fragment Shader: Faceted Diamond Starlight Flares ---
    const fragmentShader = `
      precision highp float;

      uniform float uTime;
      uniform vec3 uColorPrimary;
      uniform vec3 uColorSecondary;
      uniform vec3 uColorHighlight;

      varying vec4 vRandom;
      varying float vDist;
      varying float vPhase;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);

        // Faceted 4-point diamond star flare shape
        float diamond = abs(coord.x) + abs(coord.y);
        if (diamond > 0.5 && dist > 0.5) discard;

        // Starlight diffraction cross spikes
        float flareX = max(0.0, 1.0 - abs(coord.x) * 4.5) * max(0.0, 1.0 - abs(coord.y) * 16.0);
        float flareY = max(0.0, 1.0 - abs(coord.y) * 4.5) * max(0.0, 1.0 - abs(coord.x) * 16.0);
        float flare = (flareX + flareY) * 0.75;

        // Glowing core and diamond edge
        float core = max(0.0, 1.0 - dist * 3.0);
        float soft = max(0.0, 1.0 - diamond * 2.0);

        // Harmonic gradient between emerald, sky cyan, and golden sunlight
        vec3 col = mix(uColorPrimary, uColorSecondary, vPhase);
        col = mix(col, uColorHighlight, pow(vRandom.y, 3.5) * 0.75);

        // Sparkling brilliance
        float sparkle = 0.88 + 0.5 * sin(uTime * 4.2 + vRandom.x * 32.0 + vRandom.w * 18.0);
        col = col * sparkle + uColorHighlight * (core * 0.7 + flare * 0.55);

        float alpha = (soft + flare * 0.4 + core) * mix(0.4, 0.95, vRandom.z);
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    const activePalette = PALETTES[0];
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

      // Interactive 3D gaze camera tilt
      camera.position.x = mouse.x * 0.75;
      camera.position.y = mouse.y * 0.55;
      camera.lookAt(0, 0, 0);

      // Continuous slow 3D rotation
      group.rotation.y += 0.24 * delta;
      group.rotation.x = -0.2 + 0.12 * Math.sin(elapsed * 0.32) + mouse.y * 0.18;
      group.rotation.z = 0.08 * Math.cos(elapsed * 0.22) - mouse.x * 0.12;

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
        opacity: 0.88,
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
