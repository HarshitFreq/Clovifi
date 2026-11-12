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

    // --- Mouse & Interactive Wind Force ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- 3D Raindrop Particles Setup ---
    // 5,500 large luminous rain droplets and streaks distributed across 3D space
    const particleCount = 5500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const properties = new Float32Array(particleCount * 4); // x: size, y: tail length, z: opacity, w: seed

    for (let i = 0; i < particleCount; i++) {
      // 3D volume distribution
      positions[i * 3 + 0] = (Math.random() - 0.5) * 26.0; // wide horizontal coverage
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26.0; // vertical height span
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14.0; // 3D depth

      // Velocity: downward fall speed (4.0 to 9.5) and slight horizontal drift
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 1] = 4.2 + Math.random() * 5.2; // fall speed
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      // Properties:
      // x: size (much larger: 42 to 95 pixels for bold, glowing visibility)
      properties[i * 4 + 0] = 45.0 + Math.random() * 50.0;
      // y: aspect stretch
      properties[i * 4 + 1] = 1.6 + Math.random() * 1.8;
      // z: opacity
      properties[i * 4 + 2] = 0.55 + Math.random() * 0.45;
      // w: random phase
      properties[i * 4 + 3] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute("aProps", new THREE.BufferAttribute(properties, 4));

    // --- Vertex Shader: Continuous 3D Rainfall & Interactive Wind ---
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
        float fallDistance = position.y - uTime * aVelocity.y;
        
        // Wrap smoothly from top (+13) to bottom (-13)
        float curY = mod(fallDistance + 13.0, spanY) - 13.0;

        // Gentle horizontal sway + interactive wind gust from mouse
        float windSway = sin(uTime * 1.5 + curY * 0.25 + aProps.w * 6.28) * 0.35;
        float mouseWind = uMouse.x * 1.2;
        float curX = position.x + windSway + mouseWind * (0.5 + curY * 0.04);
        float curZ = position.z;

        vec3 p = vec3(curX, curY, curZ);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vDist = -mvPos.z;

        // Increased particle size with distance attenuation
        float size = aProps.x * (1.0 + 0.15 * sin(uTime * 3.5 + aProps.w * 12.0));
        gl_PointSize = (size * uDPR * 26.0) / max(vDist, 1.2);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    // --- Fragment Shader: Luminous Cascading Raindroplet Streaks ---
    const fragmentShader = `
      precision highp float;

      uniform vec3 uColorHead; // Bright emerald leading bead
      uniform vec3 uColorTail; // Sky cyan mist tail
      uniform vec3 uColorGlow; // Golden starlight core

      varying vec4 vProps;
      varying float vDist;
      varying float vSeed;

      void main() {
        // PointCoord (0..1, 0..1): y=0 is top (tail), y=1 is bottom (leading droplet head)
        vec2 p = gl_PointCoord;

        // Horizontal distance from center axis
        float dx = abs(p.x - 0.5) * 2.0;

        // Raindrop teardrop width profile: narrow at top, round bead at bottom
        float widthProfile = mix(0.12, 0.95, smoothstep(0.05, 0.85, p.y));
        float normDistX = dx / max(widthProfile, 0.05);

        // Rounded droplet head at the bottom
        float beadDist = length(vec2(dx * 0.85, max(0.0, p.y - 0.82) * 5.2));
        if (normDistX > 1.0 || beadDist > 1.0 || p.y < 0.02) discard;

        // Glowing core along the center
        float core = max(0.0, 1.0 - normDistX * 2.6);
        // Vertical gradient: intense bright bead at the bottom, soft glowing tail above
        float intensity = pow(p.y, 1.35);

        // Chromatic color blend: Cyan tail -> Emerald droplet -> Golden luminous highlight
        vec3 col = mix(uColorTail, uColorHead, intensity);
        col += uColorGlow * core * intensity * 1.4;

        float alpha = (1.0 - normDistX) * intensity * vProps.z;
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDPR: { value: getDPR() },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColorHead: { value: new THREE.Vector3(0.12, 0.95, 0.52) }, // Emerald Neon
        uColorTail: { value: new THREE.Vector3(0.18, 0.78, 0.98) }, // Sky Cyan
        uColorGlow: { value: new THREE.Vector3(0.98, 0.95, 0.75) }, // Golden sunlight core
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
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      material.uniforms.uTime.value = elapsed;

      // Slight perspective camera sway with wind
      camera.position.x = mouse.x * 0.6;
      camera.position.y = mouse.y * 0.4;
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
        opacity: 0.92,
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
