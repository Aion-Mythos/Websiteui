import { BRAND } from "@/content/site";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="wrap flex items-center justify-between py-6">
        <span className="font-semibold">{BRAND.short}</span>
        <ThemeToggle />
      </div>
    </main>
  );
}
