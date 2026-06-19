import type { Metadata } from "next";
import { BellRing } from "lucide-react";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | Cosmos Upgrades",
  description: "Your watched chains and configured upgrade alerts.",
};

export default function DashboardPage() {
  return (
    <div>
      <section className="hero-band border-b border-border/80">
        <div className="hero-content mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-9">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <BellRing className="h-4 w-4" />
              Your dashboard
            </div>
            <h1 className="mb-3 text-4xl font-bold leading-tight text-white md:text-5xl">
              Watchlist &amp; alerts
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300">
              Everything you track in one place: your starred chains and every
              upgrade alert you have configured.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardView />
      </section>
    </div>
  );
}
