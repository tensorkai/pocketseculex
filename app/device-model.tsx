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
      renderer.toneMappingExposure = 1.05;
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
      scene.add(new THREE.HemisphereLight(0xfff8ed, 0x757c84, 1.4));
      const key = new THREE.DirectionalLight(0xfff5e8, 2.8);
      key.position.set(-4, 6, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xdce8f5, 2.3);
      rim.position.set(4, 1, -3);
      scene.add(rim);

      const model = new THREE.Group();
      scene.add(model);
      const shell = new THREE.MeshPhysicalMaterial({
        color: 0x11151b, roughness: 0.24, metalness: 0.25,
        clearcoat: 0.45, clearcoatRoughness: 0.28, envMapIntensity: 0.65,
      });
      const edge = new THREE.MeshStandardMaterial({ color: 0x090c11, roughness: 0.3, metalness: 0.2 });
      const fabric = new THREE.MeshStandardMaterial({ color: 0x4e5350, roughness: 0.94, metalness: 0 });
      const buckle = new THREE.MeshStandardMaterial({ color: 0x8b9290, roughness: 0.28, metalness: 0.8 });
      const trigger = new THREE.MeshStandardMaterial({ color: 0xc76a43, roughness: 0.4, metalness: 0.15 });
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x080b10, roughness: 0.12, metalness: 0.1, clearcoat: 1 });

      function box(w: number, h: number, d: number, radius: number, material: import("three").Material, x: number, y: number, z: number, segments = 8) {
        const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, radius), material);
        mesh.position.set(x, y, z);
        model.add(mesh);
        return mesh;
      }

      // One smooth graphite shell; extra subdivisions only on its broad curves.
      box(2.12, 2.98, 0.55, 0.265, shell, 0, 0, 0, 16);
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
        // A compact version of the site's User & device client preview.
        const styles = getComputedStyle(document.documentElement);
        const color = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
        const background = color("--background", "#0b0d10");
        const foreground = color("--foreground", "#f6f5f2");
        const muted = color("--muted", "#a4a6ac");
        const orange = color("--orange", "#fb7043");
        const green = color("--green", "#8cdbb0");
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, 1.48, 1.42);
        ctx.fillStyle = orange;
        ctx.font = "bold 0.065px Arial";
        ctx.fillText("POCKETSECULEX", 0.08, 0.12);
        ctx.fillStyle = muted;
        ctx.font = "0.055px Arial";
        ctx.textAlign = "right";
        ctx.fillText("DEMO", 1.4, 0.12);
        ctx.textAlign = "left";
        ctx.fillStyle = green;
        ctx.beginPath(); ctx.arc(0.105, 0.26, 0.018, 0, Math.PI * 2); ctx.fill();
        ctx.font = "0.065px Arial";
        ctx.fillText("Device ready", 0.16, 0.28);
        ctx.fillStyle = muted;
        ctx.textAlign = "right";
        ctx.fillText("PSX–001", 1.4, 0.28);
        ctx.textAlign = "center";
        ctx.strokeStyle = orange;
        ctx.lineWidth = 0.016;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0.74, 0.38); ctx.lineTo(0.9, 0.44); ctx.lineTo(0.9, 0.59);
        ctx.quadraticCurveTo(0.89, 0.7, 0.74, 0.77);
        ctx.quadraticCurveTo(0.59, 0.7, 0.58, 0.59);
        ctx.lineTo(0.58, 0.44); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0.66, 0.56); ctx.lineTo(0.72, 0.62); ctx.lineTo(0.82, 0.5); ctx.stroke();
        ctx.fillStyle = foreground;
        ctx.font = "bold 0.105px Arial";
        ctx.fillText("Your everyday lifeline.", 0.74, 0.92);
        ctx.fillStyle = muted;
        ctx.font = "0.06px Arial";
        ctx.fillText("A direct line to local responders.", 0.74, 1.05);
        ctx.strokeStyle = "#ffffff26";
        ctx.lineWidth = 0.006;
        ctx.beginPath(); ctx.moveTo(0.08, 1.14); ctx.lineTo(1.4, 1.14); ctx.stroke();
        ["Ready", "Signal", "Dispatched", "Resolved"].forEach((text, index) => {
          const x = 0.22 + index * 0.345;
          ctx.fillStyle = index === 0 ? green : muted;
          ctx.beginPath(); ctx.arc(x, 1.22, 0.018, 0, Math.PI * 2); ctx.fill();
          ctx.font = "0.055px Arial";
          ctx.fillText(text, x, 1.34);
        });
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
    <div className="model-canvas" ref={host} role="img" aria-label="PocketSeculex 3D concept: smooth dark graphite enclosure, client-view demo screen with device-ready status and response stages, two orange triggers, and a woven bag strap." />
    {status !== "ready" && <div className="model-placeholder" role="status">
      <div className="fallback-strap"/><div className="fallback-shell"><span>pocketseculex</span><div className="fallback-display"><span className="fallback-status">Device ready · DEMO</span><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/></svg><strong>Your everyday lifeline.</strong><span className="fallback-flow">Ready · Signal · Dispatched · Resolved</span></div><div className="fallback-triggers"><i/><i/></div></div>
      <small>{status === "loading" ? "Preparing the 3D view…" : "Device preview · 3D unavailable on this browser"}</small>
    </div>}
    <div className="viewer-controls">
      <span>Explore the device</span>
      <div><button aria-label="Rotate device left" disabled={status !== "ready"} onClick={() => controls.current?.rotate(-Math.PI / 6)}>←</button><button aria-label="Reset device view" disabled={status !== "ready"} onClick={() => controls.current?.reset()}>Reset</button><button aria-label="Rotate device right" disabled={status !== "ready"} onClick={() => controls.current?.rotate(Math.PI / 6)}>→</button></div>
    </div>
  </div>;
}
