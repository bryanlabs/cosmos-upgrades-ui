"use client";

import dynamic from "next/dynamic";
import { Check, Copy, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopy } from "@/hooks/useCopy";
import { COSMOS_UPGRADES_API_BASE } from "@/lib/openapi";

const API_BASE = COSMOS_UPGRADES_API_BASE;

// Code-split the ~1MB Swagger UI bundle so it never loads on the home page.
const SwaggerClient = dynamic(() => import("./swagger-client"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-lg" />,
});

export function ApiExplorer() {
  return (
    <div className="space-y-6">
      <section className="surface-card rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">OpenAPI explorer</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The default server proxies through this site so the Execute button
              works from your browser. Select the public API server when copying
              endpoint URLs for external clients.
            </p>
          </div>
          <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
            {API_BASE}
          </div>
        </div>
      </section>

      <section className="swagger-shell rounded-lg border border-border bg-card p-4">
        <SwaggerClient />
      </section>

      <section className="surface-card rounded-lg p-5">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Terminal className="h-5 w-5 text-primary" />
          curl and jq examples
        </h2>
        <div className="space-y-5">
          <ExampleBlock
            title="List chains with active upgrades"
            command={`curl -s '${API_BASE}/chains?upgrade_found=true' \\
  | jq '.[] | {
      type,
      network,
      version,
      upgrade_height: .upgrade_block_height,
      eta: .estimated_upgrade_time,
      source
    }'`}
          />
          <ExampleBlock
            title="Only mainnet upgrade records"
            command={`curl -s '${API_BASE}/chains?type=mainnet&upgrade_found=true' \\
  | jq '.[] | {network, upgrade: .upgrade_name, height: .upgrade_block_height}'`}
          />
          <ExampleBlock
            title="Inspect one chain"
            command={`curl -s '${API_BASE}/chains?network=passage' | jq '.[0]'`}
          />
          <ExampleBlock
            title="Service health"
            command={`curl -s '${API_BASE}/healthz' | jq`}
          />
        </div>
      </section>
    </div>
  );
}

function ExampleBlock({ title, command }: { title: string; command: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <CopyButton text={command} />
      </div>
      <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">
        <code>{command}</code>
      </pre>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const { copy, copied } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-muted-foreground transition-colors hover:text-primary"
      aria-label="Copy command"
    >
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
