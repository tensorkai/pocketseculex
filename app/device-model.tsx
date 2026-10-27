"use client";

import { useEffect, useRef, useState } from "react";

/** The renderer lives behind this boundary so the rest of the lobby stays usable
 * while WebGL loads, or when the browser cannot provide a graphics context. */
export default function DeviceModel() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ rotate: (amount: number) => void; reset: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};

    async function mount() {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js");
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      if (cancelled || !host.current) return;

      const container = host.current;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.domElement.setAttribute("aria-hidden", "true");
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
      camera.position.set(0, 0, 9.5);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.06);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xfff8ed, 0x757c84, 2.3));
      const key = new THREE.DirectionalLight(0xfff5e8, 4.5);
      key.position.set(-4, 6, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xdce8f5, 2.3);
      rim.position.set(4, 1, -3);
      scene.add(rim);

      const model = new THREE.Group();
      scene.add(model);
      const shell = new THREE.MeshStandardMaterial({ color: 0x444b4e, roughness: 0.36, metalness: 0.35 });
      const edge = new THREE.MeshStandardMaterial({ color: 0x222a2d, roughness: 0.5, metalness: 0.15 });
      const fabric = new THREE.MeshStandardMaterial({ color: 0x4e5350, roughness: 0.94, metalness: 0 });
      const buckle = new THREE.MeshStandardMaterial({ color: 0x8b9290, roughness: 0.28, metalness: 0.8 });
      const trigger = new THREE.MeshStandardMaterial({ color: 0xc76a43, roughness: 0.4, metalness: 0.15 });
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x102a28, roughness: 0.12, metalness: 0.1, clearcoat: 1 });

      function box(w: number, h: number, d: number, radius: number, material: import("three").Material, x: number, y: number, z: number) {
        const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 8, radius), material);
        mesh.position.set(x, y, z);
        model.add(mesh);
        return mesh;
      }

      // A continuous bevelled enclosure, with an understated assembly seam.
      box(2.12, 2.98, 0.55, 0.2, shell, 0, 0, 0);
      box(2.09, 2.94, 0.08, 0.18, edge, 0, 0, -0.24);
      box(1.74, 1.68, 0.07, 0.12, edge, 0, 0.24, 0.288);
      box(1.62, 1.56, 0.04, 0.09, glass, 0, 0.24, 0.333);
      box(0.58, 0.34, 0.12, 0.1, trigger, -0.53, -0.93, 0.29);
      box(0.58, 0.34, 0.12, 0.1, trigger, 0.53, -0.93, 0.29);
      box(0.78, 1.33, 0.1, 0.035, fabric, 0, 1.97, -0.17);
      box(0.78, 1.15, 0.1, 0.05, fabric, 0, -1.98, -0.17);
      // Fine woven lines catch the light without the old heavy ribbing.
      const thread = new THREE.MeshStandardMaterial({ color: 0x777c74, roughness: 1 });
      for (let i = 0; i < 23; i++) {
        const x = -0.35 + i * 0.032;
        box(0.006, 1.27, 0.006, 0.002, thread, x, 1.97, -0.112);
        box(0.006, 1.08, 0.006, 0.002, thread, x, -1.98, -0.112);
      }
      box(0.94, 0.1, 0.16, 0.04, buckle, 0, 2.47, -0.12);
      box(0.94, 0.1, 0.16, 0.04, buckle, 0, 2.08, -0.12);
      box(0.1, 0.46, 0.16, 0.04, buckle, -0.42, 2.275, -0.12);
      box(0.1, 0.46, 0.16, 0.04, buckle, 0.42, 2.275, -0.12);
      box(0.8, 0.065, 0.07, 0.025, buckle, 0, 2.28, -0.02);
      box(0.13, 0.32, 0.04, 0.05, edge, 1.061, -0.65, 0).rotation.y = Math.PI / 2;

      const textures: import("three").Texture[] = [];
      function label(w: number, h: number, x: number, y: number, z: number, draw: (ctx: CanvasRenderingContext2D) => void) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = Math.round(1024 * h / w);
        const ctx = canvas.getContext("2d")!;
        ctx.scale(canvas.width / w, canvas.height / h);
        draw(ctx);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.push(texture);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
        mesh.position.set(x, y, z);
        model.add(mesh);
        return mesh;
      }

      label(1.48, 1.42, 0, 0.24, 0.359, ctx => {
        ctx.fillStyle = "#142b29";
        ctx.fillRect(0, 0, 1.48, 1.42);
        ctx.fillStyle = "#a2b9ad";
        ctx.font = "0.065px Arial";
        ctx.fillText("CONNECTED", 0.08, 0.12);
        ctx.fillText("98%", 1.21, 0.12);
        ctx.strokeStyle = "#cce1cc";
        ctx.lineWidth = 0.018;
        ctx.beginPath();
        ctx.moveTo(0.74, 0.32); ctx.lineTo(0.95, 0.4); ctx.lineTo(0.93, 0.65);
        ctx.quadraticCurveTo(0.88, 0.78, 0.74, 0.84);
        ctx.quadraticCurveTo(0.6, 0.78, 0.55, 0.65);
        ctx.lineTo(0.53, 0.4); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0.64, 0.57); ctx.lineTo(0.72, 0.65); ctx.lineTo(0.85, 0.49); ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = "#e0eddb";
        ctx.font = "0.125px Arial";
        ctx.fillText("Ready for your day.", 0.74, 1.04);
        ctx.font = "0.062px Arial";
        ctx.fillStyle = "#9fbaac";
        ctx.fillText("GNSS  •  LTE CONNECTED", 0.74, 1.27);
      });
      label(1.6, 0.2, 0, 1.22, 0.278, ctx => {
        ctx.textAlign = "center"; ctx.fillStyle = "#e0e3de";
        ctx.font = "0.095px Arial"; ctx.fillText("pocketseculex", 0.8, 0.13);
      });
      label(1.5, 0.18, 0, -0.64, 0.28, ctx => {
        ctx.textAlign = "center"; ctx.fillStyle = "#b7bdb9";
        ctx.font = "0.06px Arial"; ctx.fillText("PRESS BOTH BUTTONS FOR SOS", 0.75, 0.11);
      });
      label(1.4, 0.2, 0, -1.25, 0.276, ctx => {
        ctx.fillStyle = "#b5ceaa"; ctx.beginPath(); ctx.arc(0.3, 0.09, 0.018, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#c0c5c0"; ctx.font = "0.052px Arial"; ctx.fillText("SYSTEM READY", 0.37, 0.11);
      });
      const rear = label(1.6, 0.65, 0, 0, -0.287, ctx => {
        ctx.textAlign = "center"; ctx.fillStyle = "#bbc0bc";
        ctx.font = "0.12px Arial"; ctx.fillText("PocketSeculex", 0.8, 0.23);
        ctx.font = "0.065px Arial"; ctx.fillText("RESEARCH PROTOTYPE / 01", 0.8, 0.43);
      });
      rear.rotation.y = Math.PI;

      const initial = { x: 0.09, y: -0.42, z: -0.13 };
      model.rotation.set(initial.x, initial.y, initial.z);
      let target = initial.y;
      let frame = 0;
      let visible = true;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      function render() {
        frame = 0;
        if (cancelled || !visible) return;
        model.rotation.y += (target - model.rotation.y) * (reducedMotion.matches ? 1 : 0.16);
        renderer.render(scene, camera);
        if (Math.abs(target - model.rotation.y) > 0.001) frame = requestAnimationFrame(render);
      }
      function requestRender() { if (!frame && !cancelled) frame = requestAnimationFrame(render); }
      function resize() {
        const { width, height } = container.getBoundingClientRect();
        renderer.setSize(width, height);
        camera.aspect = width / Math.max(height, 1);
        camera.position.z = camera.aspect < 0.7 ? 10.8 : 9.5;
        camera.updateProjectionMatrix();
        requestRender();
      }
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      const intersection = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) requestRender();
      });
      intersection.observe(container);

      let pointer: number | null = null;
      let previousX = 0;
      const canvas = renderer.domElement;
      function down(event: PointerEvent) {
        if (event.button !== 0) return;
        pointer = event.pointerId; previousX = event.clientX;
        canvas.setPointerCapture(event.pointerId);
      }
      function move(event: PointerEvent) {
        if (pointer !== event.pointerId) return;
        target += (event.clientX - previousX) * 0.009;
        previousX = event.clientX;
        requestRender();
      }
      function up() { pointer = null; }
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      function lost(event: Event) { event.preventDefault(); setStatus("fallback"); }
      canvas.addEventListener("webglcontextlost", lost);
      controls.current = {
        rotate(amount) { target += amount; requestRender(); },
        reset() { target = initial.y; requestRender(); },
      };
      resize();
      setStatus("ready");
      dispose = () => {
        cancelAnimationFrame(frame);
        controls.current = null;
        resizeObserver.disconnect(); intersection.disconnect();
        canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("webglcontextlost", lost);
        const materials = new Set<import("three").Material>();
        model.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            for (const material of [object.material].flat()) materials.add(material);
          }
        });
        materials.forEach(material => material.dispose());
        textures.forEach(texture => texture.dispose());
        environment.dispose(); renderer.dispose(); canvas.remove();
      };
    }

    mount().catch(() => { if (!cancelled) setStatus("fallback"); });
    return () => { cancelled = true; dispose(); };
  }, []);

  return <div className="product-viewer">
    <div className="model-canvas" ref={host} role="img" aria-label="PocketSeculex 3D concept: smooth graphite enclosure, green display, two recessed orange triggers, and a woven bag strap." />
    {status !== "ready" && <div className="model-placeholder" role="status">
      <div className="fallback-strap"/><div className="fallback-shell"><span>pocketseculex</span><div className="fallback-display"><span>✓</span>Ready for your day.</div><div className="fallback-triggers"><i/><i/></div></div>
      <small>{status === "loading" ? "Preparing the 3D view…" : "Device preview · 3D unavailable on this browser"}</small>
    </div>}
    <div className="viewer-controls">
      <span>Explore the device</span>
      <div><button aria-label="Rotate device left" disabled={status !== "ready"} onClick={() => controls.current?.rotate(-Math.PI / 6)}>←</button><button aria-label="Reset device view" disabled={status !== "ready"} onClick={() => controls.current?.reset()}>Reset</button><button aria-label="Rotate device right" disabled={status !== "ready"} onClick={() => controls.current?.rotate(Math.PI / 6)}>→</button></div>
    </div>
  </div>;
}
