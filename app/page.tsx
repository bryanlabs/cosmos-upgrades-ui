import { ChainSection } from "@/components/sections/chain-section";

export default function Home() {
  return (
    <div>
      <section className="hero-band border-b border-border/80">
        <div className="hero-content mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-9">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <span className="status-dot" />
              Live Cosmos upgrade monitoring
            </div>
            <h1 className="mb-3 text-4xl font-bold leading-tight text-white md:text-5xl">
              <span className="text-primary">Upgrade</span> coordination for{" "}
              <span className="whitespace-nowrap">Cosmos validators</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300">
              Track scheduled governance upgrades, countdowns, explorer links,
              API data, and validator notification routes from one BryanLabs
              service.
            </p>
          </div>
        </div>
      </section>

      <section
        id="upgrades"
        className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-6 sm:px-6 lg:px-8"
      >
        <ChainSection />
      </section>
    </div>
  );
}
