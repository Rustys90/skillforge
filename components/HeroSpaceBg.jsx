"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Bright constellation hero — clearly visible on mobile + desktop.
 * CSS star fallback always paints; WebGL enhances when available.
 */
export default function HeroSpaceBg() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    let renderer;
    let starGeo, starMat, neonGeo, neonMat;
    let nebulaGroup;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const init = () => {
      if (disposed) return;
      const w = Math.max(mount.clientWidth || 0, window.innerWidth || 320);
      const h = Math.max(mount.clientHeight || 0, window.innerHeight || 560);
      if (w < 2 || h < 2) {
        requestAnimationFrame(init);
        return;
      }

      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "default",
        });
      } catch {
        return; // keep CSS fallback only
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.setClearColor(0x010828, 0);
      renderer.domElement.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;display:block;";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      camera.position.z = 14;

      // Nebula glows
      nebulaGroup = new THREE.Group();
      const blobs = [
        { c: 0x0c2a6e, x: -6, y: 3, s: 22, o: 0.35 },
        { c: 0x1a3a8a, x: 5, y: -2, s: 18, o: 0.28 },
        { c: 0x0a1840, x: 0, y: 0, s: 28, o: 0.25 },
        { c: 0x163060, x: 8, y: 4, s: 14, o: 0.22 },
      ];
      for (const b of blobs) {
        const geo = new THREE.CircleGeometry(b.s * 0.35, 48);
        const mat = new THREE.MeshBasicMaterial({
          color: b.c,
          transparent: true,
          opacity: b.o,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.x, b.y, -10);
        nebulaGroup.add(mesh);
      }
      scene.add(nebulaGroup);

      // Bright stars
      const starCount = reduce ? 500 : 1600;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 48;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 36;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 2;
      }
      starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.11,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        sizeAttenuation: true,
      });
      scene.add(new THREE.Points(starGeo, starMat));

      // Neon green sparks
      const neonCount = reduce ? 60 : 140;
      const neonPos = new Float32Array(neonCount * 3);
      for (let i = 0; i < neonCount; i++) {
        neonPos[i * 3] = (Math.random() - 0.5) * 40;
        neonPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
        neonPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
      }
      neonGeo = new THREE.BufferGeometry();
      neonGeo.setAttribute("position", new THREE.BufferAttribute(neonPos, 3));
      neonMat = new THREE.PointsMaterial({
        color: 0x6fff00,
        size: 0.14,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });
      const neon = new THREE.Points(neonGeo, neonMat);
      scene.add(neon);

      const stars = scene.children.find((c) => c.isPoints && c.material === starMat);

      const onResize = () => {
        const nw = Math.max(mount.clientWidth, window.innerWidth);
        const nh = Math.max(mount.clientHeight, window.innerHeight);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh, false);
      };
      window.addEventListener("resize", onResize);

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        if (!reduce) {
          if (stars) {
            stars.rotation.y = t * 0.025;
            stars.rotation.x = Math.sin(t * 0.06) * 0.04;
          }
          neon.rotation.y = -t * 0.035;
          nebulaGroup.rotation.z = Math.sin(t * 0.05) * 0.06;
        }
        renderer.render(scene, camera);
      };
      animate();

      // store cleanup bits on mount
      mount.__sfCleanup = () => {
        window.removeEventListener("resize", onResize);
      };
    };

    // Wait one frame so layout has real size
    const id = requestAnimationFrame(() => requestAnimationFrame(init));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(id);
      if (mount.__sfCleanup) mount.__sfCleanup();
      try {
        starGeo?.dispose();
        starMat?.dispose();
        neonGeo?.dispose();
        neonMat?.dispose();
        nebulaGroup?.traverse((obj) => {
          obj.geometry?.dispose();
          obj.material?.dispose();
        });
        renderer?.dispose();
        if (renderer?.domElement?.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="hero-space-bg absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Always-visible CSS fallback (works even if WebGL fails) */}
      <div className="hero-space-fallback" />
    </div>
  );
}
