"use client";

import SwaggerUI from "swagger-ui-react";
import { Copy, Terminal } from "lucide-react";

const API_BASE = "https://cosmos-upgrades.bryanlabs.net";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Cosmos Upgrades API",
    version: "1.0.0",
    description:
      "Public JSON API for Cosmos chain upgrade tracking. Use /chains for new integrations and keep /mainnets or /testnets for older scripts.",
  },
  servers: [
    {
      url: "/api/cosmos-upgrades",
      description: "Try it from this page",
    },
    {
      url: API_BASE,
      description: "Public API endpoint",
    },
  ],
  paths: {
    "/chains": {
      get: {
        tags: ["Upgrade data"],
        summary: "Combined upgrade data",
        description:
          "Preferred endpoint for new tooling. Returns one flat array across mainnets and testnets, with optional filters.",
        parameters: [
          {
            name: "type",
            in: "query",
            description: "Restrict results to mainnet or testnet chains.",
            schema: {
              type: "string",
              enum: ["mainnet", "testnet"],
            },
          },
          {
            name: "upgrade_found",
            in: "query",
            description: "Return only chains with or without an active upgrade.",
            schema: {
              type: "boolean",
            },
          },
          {
            name: "network",
            in: "query",
            description: "Filter to one chain registry network id.",
            schema: {
              type: "string",
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Limit the number of records returned.",
            schema: {
              type: "integer",
              minimum: 1,
            },
          },
        ],
        responses: {
          "200": {
            description: "A filtered list of upgrade records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ChainUpgrade",
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameter.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/mainnets": {
      get: {
        tags: ["Compatibility"],
        summary: "Mainnet upgrade scan",
        description:
          "Compatibility endpoint returning mainnet scan results only.",
        responses: {
          "200": {
            description: "Mainnet upgrade records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ChainUpgrade",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/testnets": {
      get: {
        tags: ["Compatibility"],
        summary: "Testnet upgrade scan",
        description:
          "Compatibility endpoint returning testnet scan results only.",
        responses: {
          "200": {
            description: "Testnet upgrade records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ChainUpgrade",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ChainUpgrade: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["mainnet", "testnet"],
            description: "Network class.",
          },
          network: {
            type: "string",
            description: "Chain registry network id.",
          },
          latest_block_height: {
            type: "integer",
            nullable: true,
            description: "Latest observed block height.",
          },
          upgrade_found: {
            type: "boolean",
            description: "True when an upgrade signal is active.",
          },
          upgrade_name: {
            type: "string",
            nullable: true,
            description: "Detected upgrade name when available.",
          },
          version: {
            type: "string",
            nullable: true,
            description: "Reported upgrade version when available.",
          },
          upgrade_block_height: {
            type: "integer",
            nullable: true,
            description: "Target upgrade block height.",
          },
          estimated_upgrade_time: {
            type: "string",
            nullable: true,
            description: "Estimated upgrade wall-clock time.",
          },
          source: {
            type: "string",
            nullable: true,
            description: "Source of the upgrade signal.",
          },
          rpc_server: {
            type: "string",
            nullable: true,
            description: "RPC endpoint used by the scanner.",
          },
          rest_server: {
            type: "string",
            nullable: true,
            description: "REST endpoint used by the scanner.",
          },
          explorer_url: {
            $ref: "#/components/schemas/ExplorerUrl",
          },
          logo_urls: {
            $ref: "#/components/schemas/LogoUrls",
          },
        },
      },
      ExplorerUrl: {
        type: "object",
        nullable: true,
        properties: {
          kind: {
            type: "string",
          },
          url: {
            type: "string",
          },
        },
      },
      LogoUrls: {
        type: "object",
        nullable: true,
        properties: {
          png: {
            type: "string",
          },
          svg: {
            type: "string",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
          },
        },
      },
    },
  },
};

export function ApiExplorer() {
  return (
    <div className="space-y-6">
      <section className="surface-card rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">OpenAPI explorer</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The default server uses this site as a proxy so browser requests
              work from the Execute button. Select the public API server when
              copying endpoint URLs for external clients.
            </p>
          </div>
          <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
            {API_BASE}
          </div>
        </div>
      </section>

      <section className="swagger-shell rounded-lg border border-border bg-card p-4">
        <SwaggerUI
          spec={openApiSpec}
          deepLinking
          docExpansion="list"
          defaultModelsExpandDepth={-1}
          persistAuthorization
          tryItOutEnabled
          supportedSubmitMethods={["get"]}
        />
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
            title="Compact validator watch list"
            command={`curl -s '${API_BASE}/chains?upgrade_found=true' \\
  | jq -r '.[] | [.type, .network, .version, .upgrade_block_height, .estimated_upgrade_time] | @tsv'`}
          />
        </div>
      </section>
    </div>
  );
}

function ExampleBlock({
  title,
  command,
}: {
  title: string;
  command: string;
}) {
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
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-muted-foreground transition-colors hover:text-primary"
      aria-label="Copy"
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}
