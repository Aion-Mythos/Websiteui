/**
 * Every piece of dynamic or likely-to-change content lives here.
 * Release data is placeholder until a real release pipeline feeds it.
 */

export const BRAND = {
  /** The product name. Not final: change it here and it changes everywhere. */
  name: "Wernix OS",
  /** Short form used for the wordmark and inline mentions. */
  short: "Wernix",
  /** The star at the centre of the 3D scene. */
  star: "Ortiplex",
  city: "Lahore",
  licence: "GPL-3.0-or-later",
} as const;

export const RELEASE = {
  version: "0.9.2",
  codename: "Patina",
  channel: "Preview",
  /** ISO 8601 date. */
  date: "2026-11-04",
  isoSizeGB: 2.4,
  isoFile: `${BRAND.short.toLowerCase()}-0.9.2-x86_64.iso`,
  /** Placeholder until a real build exists. */
  sha256: "0000000000000000000000000000000000000000000000000000000000000000",
  arch: "x86_64",
  firmware: "UEFI only",
  minDiskGB: 30,
  downloadUrl: "#download",
  verifyUrl: "/docs#verify",
  changelog: [
    { kind: "added", text: "Hyprland shell with a calm default layout and per-monitor scaling" },
    { kind: "changed", text: "Zen kernel 6.17 with zram enabled at first boot" },
    { kind: "fixed", text: "isu keeps an existing Windows EFI partition untouched on dual boot" },
  ],
} as const;

export const NAV = [
  { label: "Features", href: "#around" },
  { label: "Desktop", href: "#apart" },
  { label: "Docs", href: "/docs" },
  { label: "Community", href: "#footer" },
] as const;

export const HERO = {
  titleLines: ["An OS built around", "a star."],
  /** One word in the supporting line rotates through these, at most one rotating word. */
  rotating: ["quiet", "precise", "yours"],
  supportBefore: "Arch underneath, kept",
  supportAfter: `on the surface. ${BRAND.short} gives power users a calm desktop and every lever behind it.`,
  primaryCta: `Download ${BRAND.short}`,
  secondaryCta: "Read the docs",
} as const;

export const CLOSE_UP = {
  eyebrow: "01 · Philosophy",
  heading: "Calm on the surface. Full control underneath.",
  body: [
    `Most of the time an operating system should be silent. ${BRAND.short} ships one desktop, one package story and sane defaults, so the first hour is spent working, not configuring.`,
    "When you do want to reach in, nothing is hidden. It is Arch: plain text config, a rolling base and a system manager that prints the commands it runs.",
  ],
} as const;

export const LAYERS = [
  {
    id: "core",
    part: "Core",
    label: "Kernel",
    title: "Zen kernel on an Arch base",
    detail: "Tuned for desktop latency. Rolling, signed packages straight from Arch.",
  },
  {
    id: "rings",
    part: "Inner rings",
    label: "Boot",
    title: "Limine, unified kernel images, btrfs snapshots",
    detail: "Every update takes a snapshot. Roll back from the boot menu.",
  },
  {
    id: "cage",
    part: "Cage",
    label: "Encryption",
    title: "LUKS2 with argon2id",
    detail: "Full-disk encryption by default, with a memory-hard key derivation.",
  },
  {
    id: "outer",
    part: "Outer ring",
    label: "Desktop",
    title: "Hyprland shell",
    detail: "Tiling when you want it, quiet floating windows when you do not.",
  },
  {
    id: "base",
    part: "Base plate",
    label: "Installer",
    title: "isu, the TUI installer",
    detail: "Never deletes another OS. Makes its own EFI partition for dual boot.",
  },
] as const;

export const APART = {
  eyebrow: "02 · Anatomy",
  heading: "Take it apart. Every layer has a job.",
  body: `Ortiplex is the instrument ${BRAND.short} is built around. Pull it open and each part maps to a layer of the system.`,
} as const;

export const AROUND = {
  eyebrow: "03 · Defaults",
  heading: "Decisions already made, all of them reversible.",
  facts: [
    { label: "dual-boot", title: "Dual boot safe", text: "isu creates its own EFI partition and never resizes Windows." },
    { label: "zram", title: "zram on by default", text: "Compressed swap in memory from the first boot." },
    { label: "firmware", title: "Firmware for your hardware only", text: "Detected at install time. Nothing you do not need." },
    { label: "online", title: "Online install", text: "Packages are fetched fresh, so day one is already up to date." },
    { label: "disk", title: "30 GB minimum", text: "Room for the system, snapshots and a few kernels." },
    { label: "uefi", title: "UEFI only", text: "No legacy BIOS path. One boot story, done properly." },
  ],
} as const;

/** System manager commands. Names may change, so they live here. */
export const VSM = {
  binary: "vsm",
  commands: [
    { cmd: "vsm update", note: "snapshot, then update everything" },
    { cmd: "vsm get plasma", note: "add a curated desktop or bundle" },
    { cmd: "vsm install <pkg>", note: "install from Arch repos or the AUR" },
    { cmd: "vsm cheat", note: "print the commands vsm runs for you" },
  ],
} as const;

export const OUTRO = {
  eyebrow: "04 · Assembled",
  heading: "Put back together, ready to boot.",
  body: "One ISO, verified before you write it. Install alongside what you already have.",
  verifyLabel: "Verify the ISO",
} as const;

export const FOOTER = {
  columns: [
    {
      title: "Project",
      links: [
        { label: "Download", href: "#download" },
        { label: "Docs", href: "/docs" },
        { label: "Release notes", href: "/docs#release-notes" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Forum", href: "#footer" },
        { label: "Matrix", href: "#footer" },
        { label: "Source code", href: "#footer" },
      ],
    },
  ],
  licenceNote: `Free software. ${BRAND.short} is released under the GPL and built on Arch Linux.`,
  madeIn: `Made in ${BRAND.city}`,
} as const;

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
