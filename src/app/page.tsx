import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/footer";
import {
  Evidence,
  FinalCta,
  Marquee,
  Outcomes,
  Preview,
  Process,
  Statement,
} from "@/components/landing/sections";

export default function Home() {
  return (
    <main className="lp">
      <div className="lp-noise" aria-hidden />
      <LandingNav />
      <Hero />
      <Marquee />
      <Statement />
      <Process />
      <Outcomes />
      <Evidence />
      <Preview />
      <FinalCta />
      <LandingFooter />
    </main>
  );
}
