"use client";

import { useEffect } from "react";
import { CssRing } from "./css-ring";

/** Milestone 2 placeholder: no 3D yet, so the CSS ring stands in. */
export function Stage() {
  useEffect(() => {
    document.documentElement.classList.add("no-webgl");
  }, []);
  return <CssRing />;
}
