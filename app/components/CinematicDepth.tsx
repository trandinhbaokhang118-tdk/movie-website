"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CinematicDepth({ accent = "#8b7cff" }: { accent?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearAlpha(0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 7;
    const group = new THREE.Group();
    scene.add(group);

    const color = new THREE.Color(accent);
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.55, 0.28, 96, 12),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.14 }),
    );
    knot.rotation.x = 0.75;
    group.add(knot);

    const halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.35, 1),
      new THREE.MeshBasicMaterial({ color: "#62e7e2", wireframe: true, transparent: true, opacity: 0.055 }),
    );
    group.add(halo);

    const points = Array.from({ length: 180 }, () => [
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 5,
    ]).flat();
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: "#ffffff", size: 0.028, transparent: true, opacity: 0.42 }),
    );
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.5;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.35;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      group.rotation.y += (pointer.x - group.rotation.y) * 0.025;
      group.rotation.x += (-pointer.y - group.rotation.x) * 0.025;
      knot.rotation.z = elapsed * 0.075;
      halo.rotation.y = -elapsed * 0.035;
      particles.rotation.y = elapsed * 0.008;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      knot.geometry.dispose();
      (knot.material as THREE.Material).dispose();
      halo.geometry.dispose();
      (halo.material as THREE.Material).dispose();
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [accent]);

  return <div ref={host} className="cinematic-depth" aria-hidden="true" />;
}
