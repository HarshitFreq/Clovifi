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
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 12.5);
    camera.lookAt(0, 0, 0);

    // --- Mouse & Interactive Celestial Gaze ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // --- Cosmic Space Particles Setup ---
    // 1. Spiral Galaxy Disk: 4,200 particles across 3 spiral arms (Clovifi Shamrock Galaxy)
    // 2. Deep Field Starfield & Nebula Dust: 2,300 volumetric stars
    const galaxyCount = 4200;
    const starfieldCount = 2300;
    const totalCount = galaxyCount + starfieldCount;

    const positions = new Float32Array(totalCount * 3);
    const cosmicData = new Float32Array(totalCount * 4); // x: radius, y: baseAngle, z: orbitSpeed, w: isBright
    const colors = new Float32Array(totalCount * 3);
    const props = new Float32Array(totalCount * 4); // x: size, y: twinkleSpeed, z: opacity, w: seed

    // 3 arms for Clovifi signature celestial theme
    const arms = 3;

    for (let i = 0; i < galaxyCount; i++) {
      // Radius distribution: concentrated near core, expanding to halo
      const r = 0.6 + Math.pow(Math.random(), 1.7) * 14.0;
      const armIndex = i % arms;
      const armAngle = (armIndex * 2 * Math.PI) / arms;
      
      // Logarithmic spiral curve
      const spiralCurvature = 0.58 * Math.log(r + 1.0);
      const scatterAngle = (Math.random() - 0.5) * (0.32 + 0.16 * Math.sqrt(r));
      const theta = armAngle + spiralCurvature * 2.9 + scatterAngle;

      // Vertical thickness flares softly at outer rim
      const diskHeight = (Math.random() - 0.5) * (0.35 + 0.08 * r);
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = diskHeight;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Differential orbit speed: inner core faster, outer arms sweep peacefully
      const orbitSpeed = (0.042 / Math.sqrt(r + 0.7)) * (0.92 + Math.random() * 0.16);
      const isBright = Math.random() < 0.055 ? 1.0 : 0.0;

      cosmicData[i * 4 + 0] = r;
      cosmicData[i * 4 + 1] = theta;
      cosmicData[i * 4 + 2] = orbitSpeed;
      cosmicData[i * 4 + 3] = isBright;

      // Colors: core has soft starlight/mint, arms have rich emerald and celestial teal
      const colorMix = Math.random();
      if (isBright > 0.5) {
        // Bright stellar anchor beacon (pure starlight silver/mint)
        colors[i * 3 + 0] = 0.90;
        colors[i * 3 + 1] = 0.98;
        colors[i * 3 + 2] = 0.94;
      } else if (r < 2.8) {
        // Galactic core stardust (pale mint starlight)
        colors[i * 3 + 0] = 0.42 + 0.35 * Math.random();
        colors[i * 3 + 1] = 0.85 + 0.12 * Math.random();
        colors[i * 3 + 2] = 0.65 + 0.25 * Math.random();
      } else if (colorMix < 0.62) {
        // Emerald spiral arm dust
        colors[i * 3 + 0] = 0.12 + 0.14 * Math.random();
        colors[i * 3 + 1] = 0.65 + 0.22 * Math.random();
        colors[i * 3 + 2] = 0.36 + 0.14 * Math.random();
      } else {
        // Celestial cyan / aqua dust
        colors[i * 3 + 0] = 0.08 + 0.10 * Math.random();
        colors[i * 3 + 1] = 0.52 + 0.22 * Math.random();
        colors[i * 3 + 2] = 0.64 + 0.26 * Math.random();
      }

      // Props: x: size, y: twinkleSpeed, z: opacity, w: seed
      props[i * 4 + 0] = isBright > 0.5 ? 38.0 + Math.random() * 28.0 : 16.0 + Math.random() * 24.0;
      props[i * 4 + 1] = 0.8 + Math.random() * 2.2;
      props[i * 4 + 2] = isBright > 0.5 ? 0.72 : (0.24 + Math.random() * 0.38);
      props[i * 4 + 3] = Math.random();
    }

    // Deep Field Background Stars & Nebula
    for (let j = 0; j < starfieldCount; j++) {
      const idx = galaxyCount + j;

      // Volumetric sphere / deep celestial halo
      const u = Math.random();
      const v = Math.random();
      const phi = u * 2.0 * Math.PI;
      const costheta = v * 2.0 - 1.0;
      const sintheta = Math.sqrt(Math.max(0.0, 1.0 - costheta * costheta));
      const rad = 7.0 + Math.cbrt(Math.random()) * 24.0;

      const x = rad * sintheta * Math.cos(phi);
      const y = rad * costheta * 0.82;
      const z = rad * sintheta * Math.sin(phi);

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      const isBeacon = Math.random() < 0.038 ? 1.0 : 0.0;
      cosmicData[idx * 4 + 0] = rad;
      cosmicData[idx * 4 + 1] = phi;
      cosmicData[idx * 4 + 2] = 0.004 * (Math.random() - 0.5); // Very slow drift
      cosmicData[idx * 4 + 3] = isBeacon;

      if (isBeacon > 0.5) {
        colors[idx * 3 + 0] = 0.92;
        colors[idx * 3 + 1] = 0.98;
        colors[idx * 3 + 2] = 0.96;
      } else {
        const starType = Math.random();
        if (starType < 0.52) {
          // Soft emerald star
          colors[idx * 3 + 0] = 0.18 + Math.random() * 0.18;
          colors[idx * 3 + 1] = 0.62 + Math.random() * 0.24;
          colors[idx * 3 + 2] = 0.38 + Math.random() * 0.18;
        } else if (starType < 0.82) {
          // Cosmic cyan star
          colors[idx * 3 + 0] = 0.12 + Math.random() * 0.10;
          colors[idx * 3 + 1] = 0.56 + Math.random() * 0.20;
          colors[idx * 3 + 2] = 0.74 + Math.random() * 0.20;
        } else {
          // Silver starlight
          colors[idx * 3 + 0] = 0.82;
          colors[idx * 3 + 1] = 0.92;
          colors[idx * 3 + 2] = 0.88;
        }
      }

      props[idx * 4 + 0] = isBeacon > 0.5 ? 32.0 + Math.random() * 24.0 : 10.0 + Math.random() * 20.0;
      props[idx * 4 + 1] = 0.5 + Math.random() * 2.8;
      props[idx * 4 + 2] = isBeacon > 0.5 ? 0.68 : (0.16 + Math.random() * 0.32);
      props[idx * 4 + 3] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aCosmicData", new THREE.BufferAttribute(cosmicData, 4));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aProps", new THREE.BufferAttribute(props, 4));

    // --- Vertex Shader: 3D Cosmic Celestial Galaxy & Starfield ---
    const vertexShader = `
      attribute vec4 aCosmicData;
      attribute vec3 aColor;
      attribute vec4 aProps;

      uniform float uTime;
      uniform float uDPR;
      uniform vec2 uMouse;

      varying vec3 vColor;
      varying vec4 vProps;
      varying float vDist;
      varying float vIsBright;

      void main() {
        vColor = aColor;
        vProps = aProps;
        vIsBright = aCosmicData.w;

        float r = aCosmicData.x;
        float baseAngle = aCosmicData.y;
        float speed = aCosmicData.z;

        vec3 p = position;

        // Galaxy Disk Particles (speed > 0.005)
        if (abs(speed) > 0.005) {
          float currentAngle = baseAngle + uTime * speed;
          p.x = cos(currentAngle) * r;
          p.z = sin(currentAngle) * r;

          // Natural galactic inclination: pitch ~32 deg, yaw ~-18 deg
          float pitch = 0.56;
          float cosP = cos(pitch);
          float sinP = sin(pitch);
          float py = p.y * cosP - p.z * sinP;
          float pz = p.y * sinP + p.z * cosP;
          p.y = py;
          p.z = pz;

          float yaw = -0.32;
          float cosY = cos(yaw);
          float sinY = sin(yaw);
          float px = p.x * cosY + p.z * sinY;
          pz = -p.x * sinY + p.z * cosY;
          p.x = px;
          p.z = pz;

          // Center the galactic core slightly lower to frame the Clovifi typography
          p.y -= 1.2;
          p.z -= 2.2;
        } else {
          // Subtle celestial drift for background field stars
          float drift = uTime * speed;
          p.x += sin(drift + aProps.w * 6.28) * 0.35;
          p.y += cos(drift * 0.8 + aProps.w * 6.28) * 0.25;
        }

        // Smooth interactive parallax gaze
        p.x += uMouse.x * (0.75 + p.z * 0.025);
        p.y += uMouse.y * (0.55 + p.z * 0.025);

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        vDist = -mvPos.z;

        // Subtle organic starlight twinkle
        float twinkle = 0.82 + 0.18 * sin(uTime * aProps.y + aProps.w * 62.8);
        float pSize = aProps.x * twinkle;

        // Attenuate point size smoothly with distance
        gl_PointSize = (pSize * uDPR * 22.0) / max(vDist, 1.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    // --- Fragment Shader: Luminous Star Core & 4-Point Cosmic Diffraction Spikes ---
    const fragmentShader = `
      precision highp float;

      varying vec3 vColor;
      varying vec4 vProps;
      varying float vDist;
      varying float vIsBright;

      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float d = length(p);
        if (d > 0.5) discard;

        // Luminous stellar core (Gaussian falloff)
        float core = exp(-24.0 * d * d);
        // Soft cosmic halo & interstellar gas haze
        float halo = exp(-5.2 * d);

        // Diffraction cross for bright celestial beacon stars (James Webb / Hubble style glint)
        float spikes = 0.0;
        if (vIsBright > 0.5) {
          float spikeH = (0.012 / (abs(p.y) + 0.014)) * smoothstep(0.48, 0.0, abs(p.x));
          float spikeV = (0.012 / (abs(p.x) + 0.014)) * smoothstep(0.48, 0.0, abs(p.y));
          spikes = (spikeH + spikeV) * 0.42;
        }

        // Combined stellar intensity
        float intensity = core * 0.95 + halo * 0.38 + spikes;

        // Color blend: core radiates bright starlight mint-silver, bleeding outwards to emerald/cyan
        vec3 starlightCore = vec3(0.94, 1.0, 0.96);
        vec3 finalColor = mix(vColor, starlightCore, core * 0.75 + spikes * 0.5);

        // Low-contrast, gentle alpha so it never overwhelms content
        float alpha = clamp(intensity * vProps.z * 0.82, 0.0, 1.0);
        if (alpha < 0.01) discard;

        gl_FragColor = vec4(finalColor * alpha, alpha);
      }
    `;

    // Shader Material with Additive Blending
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDPR: { value: getDPR() },
        uMouse: { value: new THREE.Vector2(0, 0) },
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
      mouse.x += (mouse.targetX - mouse.x) * 0.035;
      mouse.y += (mouse.targetY - mouse.y) * 0.035;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      material.uniforms.uTime.value = elapsed;

      // Subtle, gentle camera drift with interactive gaze
      camera.position.x = mouse.x * 0.55;
      camera.position.y = mouse.y * 0.40;
      camera.lookAt(0, -0.6, 0);

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
        opacity: 0.58, // Perfectly balanced calm, low-contrast cosmic background
        transition: "opacity 0.6s ease",
      }}
    />
  );
}
