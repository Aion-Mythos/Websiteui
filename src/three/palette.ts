/**
 * Scene colours come from the CSS custom properties in wernix-colors.css,
 * read at runtime so a theme toggle re-tints the scene without a reload.
 */
import { Color } from "three";

const KEYS = [
  "background",
  "key",
  "strip",
  "fill",
  "metal-face",
  "metal-deep",
  "metal-edge",
  "patina",
  "patina-deep",
  "core",
  "core-glow",
  "line",
  "shadow",
] as const;

export type PaletteKey = (typeof KEYS)[number];
export type Palette = Record<PaletteKey, Color> & { light: boolean; backgroundCss: string };

export function readPalette(): Palette {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const out = { light: root.getAttribute("data-theme") === "light" } as Palette;
  for (const k of KEYS) {
    const raw = cs.getPropertyValue(`--scene-${k}`).trim();
    // setStyle converts sRGB CSS colours into the linear working space.
    out[k] = new Color().setStyle(raw || "#808080");
  }
  out.backgroundCss = cs.getPropertyValue("--scene-background").trim();
  return out;
}
