"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Procedural space hero — constellation + soft nebula (ThreeUI-inspired).
 * No external video; works on mobile; respects reduced-motion.
 */
export default function HeroSpaceBg() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    renderer.setClearColor(0x010828, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.z = 18;

    // Soft nebula planes
    const nebulaGroup = new THREE.Group();
    const nebulaColors = [0x0a1a4a, 0x12285c, 0x0d2040, 0x061030];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.PlaneGeometry(40, 28);
      const mat = new THREE.MeshBasicMaterial({
        color: nebulaColors[i],
        transparent: true,
        opacity: 0.22 + i * 0.04,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((i - 1.5) * 3, (i % 2) * 2 - 1, -8 - i * 2);
      mesh.rotation.z = i * 0.2;
      nebulaGroup.add(mesh);
    }
    scene.add(nebulaGroup);

    // Star field
    const starCount = reduce ? 400 : 1200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
      sizes[i] = Math.random();
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
      color: 0xeff4ff,
      size: 0.06,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Neon accent particles (SkillForge green)
    const neonCount = reduce ? 40 : 90;
    const neonPos = new Float32Array(neonCount * 3);
    for (let i = 0; i < neonCount; i++) {
      neonPos[i * 3] = (Math.random() - 0.5) * 40;
      neonPos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      neonPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const neonGeo = new THREE.BufferGeometry();
    neonGeo.setAttribute("position", new THREE.BufferAttribute(neonPos, 3));
    const neonMat = new THREE.PointsMaterial({
      color: 0x6fff00,
      size: 0.09,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const neon = new THREE.Points(neonGeo, neonMat);
    scene.add(neon);

    let frame = 0;
    let raf = 0;
    const clock = new THREE.Clock();

    const onResize = () => {
      const nw = mount.clientWidth || window.innerWidth;
      const nh = mount.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!reduce) {
        stars.rotation.y = t * 0.02;
        stars.rotation.x = Math.sin(t * 0.05) * 0.03;
        neon.rotation.y = -t * 0.03;
        nebulaGroup.rotation.z = Math.sin(t * 0.04) * 0.05;
        nebulaGroup.children.forEach((m, i) => {
          m.position.x += Math.sin(t * 0.1 + i) * 0.002;
        });
      }
      renderer.render(scene, camera);
      frame++;
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      starGeo.dispose();
      starMat.dispose();
      neonGeo.dispose();
      neonMat.dispose();
      nebulaGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 overflow-hidden"
      aria-hidden
      style={{ background: "#010828" }}
    />
  );
}
