/** Joins class names. Kept tiny on purpose instead of clsx + tailwind-merge. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
