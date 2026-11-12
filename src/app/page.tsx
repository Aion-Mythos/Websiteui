import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { CloseUp } from "@/components/sections/closeup";
import { Apart } from "@/components/sections/apart";
import { Around } from "@/components/sections/around";
import { Outro } from "@/components/sections/outro";
import { Footer } from "@/components/sections/footer";
import { Stage } from "@/components/stage/stage";

export default function Home() {
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-control bg-accent px-4 py-2 text-accent-on focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Nav />
      {/* One canvas behind, the story in front. overflow-x: clip, never hidden. */}
      <main className="relative overflow-x-clip">
        <Stage />
        <div id="content" className="relative z-10">
          <Hero />
          <CloseUp />
          <Apart />
          <Around />
          <Outro />
          <Footer />
        </div>
      </main>
    </>
  );
}
