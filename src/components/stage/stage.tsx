"use client";

import { useEffect, useRef, useState } from "react";
import type { Engine } from "@/three/engine";
import { stage, useStage } from "@/lib/store";
import { CssRing } from "./css-ring";
import { Callouts } from "./callouts";
import { StageControls } from "./stage-controls";
import { BRAND } from "@/content/site";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    const ok = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

function fallback() {
  stage.set({ webgl: "failed", loading: 1 });
  document.documentElement.classList.add("no-webgl");
  document.documentElement.dataset.stage = "fallback";
}

/**
 * One fixed canvas behind the page. The engine is code-split and loaded
 * after first paint; the HTML is complete and readable without it.
 */
export function Stage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => stage.set({ reducedMotion: mq.matches });
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("nowebgl") || !webglAvailable()) {
      fallback();
      return;
    }
    document.documentElement.dataset.stage = "loading";
    let disposed = false;
    let instance: Engine | null = null;
    // The page is complete without 3D, so the engine waits until it has loaded and gone idle.
    const whenIdle = () =>
      new Promise<void>((resolve) => {
        const go = () =>
          typeof window.requestIdleCallback === "function"
            ? window.requestIdleCallback(() => resolve(), { timeout: 1200 })
            : setTimeout(resolve, 200);
        if (document.readyState === "complete") go();
        else window.addEventListener("load", go, { once: true });
      });
    whenIdle()
      .then(() => import("@/three/engine"))
      .then(async ({ Engine }) => {
        if (disposed) return;
        instance = new Engine({
          canvas: el,
          snap: params.has("snap"),
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
        await instance.init((p) => stage.set({ loading: p }));
        if (disposed) return;
        stage.set({ webgl: "ok", ready: true, loading: 1 });
        document.documentElement.dataset.stage = "ready";
        setEngine(instance);
      })
      .catch((err) => {
        console.warn("[stage] WebGL unavailable, using the CSS fallback.", err);
        instance?.dispose();
        instance = null;
        fallback();
      });
    return () => {
      disposed = true;
      instance?.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden="true"
        tabIndex={-1}
        className="stage-canvas pointer-events-none fixed inset-0 z-0 block h-[100lvh] w-full"
      />
      <CssRing />
      <Loader />
      {engine && <Callouts engine={engine} />}
      <StageControls />
    </>
  );
}

function Loader() {
  const loading = useStage((s) => s.loading);
  const webgl = useStage((s) => s.webgl);
  const done = webgl !== "pending" && loading >= 1;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 transition-opacity duration-500 md:left-[71%] ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="h-px w-28 overflow-hidden bg-hairline">
        <div className="h-full origin-left bg-accent-line transition-transform duration-300" style={{ transform: `scaleX(${loading})` }} />
      </div>
      <span className="mono-label">Calibrating {BRAND.star}</span>
    </div>
  );
}
