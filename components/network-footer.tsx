const LINKS = [
  { label: "Website", href: "https://bryanlabs.net" },
  { label: "Snapshots", href: "https://snapshots.bryanlabs.net" },
  { label: "Explorer", href: "https://explore.bryanlabs.net" },
  { label: "Upgrade Hub", href: "https://upgrade-hub.bryanlabs.net" },
  { label: "GitHub", href: "https://github.com/bryanlabs" },
];

export function NetworkFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            <span className="bg-gradient-to-r from-[#60a5fa] to-[#8b5cf6] bg-clip-text text-transparent">Bryan</span>Labs
          </span>
          <span>. Cosmos infrastructure</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <div className="text-xs">{"©"} {year} Bryanlabs</div>
      </div>
    </footer>
  );
}
