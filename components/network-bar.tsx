const APPS = [
  { label: "Website", href: "https://bryanlabs.net", key: "website" },
  { label: "Snapshots", href: "https://snapshots.bryanlabs.net", key: "snapshots" },
  { label: "Upgrade Hub", href: "https://upgrade-hub.bryanlabs.net", key: "upgrades" },
  { label: "Explorer", href: "https://explore.bryanlabs.net", key: "explorer" },
];

export function NetworkBar({ current }: { current: string }) {
  return (
    <div className="w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <a href="https://bryanlabs.net" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bryanlabs-logo-transparent.png" alt="BryanLabs" className="h-7 w-7" />
          <span className="text-base font-semibold text-foreground">
            <span className="bg-gradient-to-r from-[#60a5fa] to-[#8b5cf6] bg-clip-text text-transparent">Bryan</span>Labs
          </span>
        </a>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {APPS.map((a) => {
            const active = a.key === current;
            return (
              <a
                key={a.key}
                href={a.href}
                className={
                  active
                    ? "shrink-0 rounded-md bg-primary/15 px-2.5 py-1 font-medium text-primary"
                    : "shrink-0 rounded-md px-2.5 py-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                }
              >
                {a.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
