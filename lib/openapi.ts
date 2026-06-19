// OpenAPI 3.1 spec for the Cosmos Upgrades API.
//
// Authored here because the upstream `cosmos-upgrades` service does not serve
// its own spec yet. Keep it in sync with the real Flask routes. Future
// improvement: have the API serve GET /openapi.json and fetch it instead of
// hand-maintaining this file.

export const COSMOS_UPGRADES_API_BASE = "https://cosmos-upgrades.bryanlabs.net";

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Cosmos Upgrades API",
    version: "1.0.0",
    description:
      "Public JSON API for Cosmos chain upgrade tracking. Use /chains for new integrations; /mainnets and /testnets remain for older scripts.",
  },
  servers: [
    {
      url: "/api/cosmos-upgrades",
      description: "Proxied through this site (use for the Execute button)",
    },
    {
      url: COSMOS_UPGRADES_API_BASE,
      description: "Public API endpoint",
    },
  ],
  tags: [
    { name: "Upgrade data", description: "Chain upgrade scan results." },
    { name: "Compatibility", description: "Legacy mainnet/testnet endpoints." },
    { name: "Operations", description: "Liveness and monitoring." },
    { name: "Admin", description: "Operator-only endpoints." },
  ],
  paths: {
    "/chains": {
      get: {
        tags: ["Upgrade data"],
        summary: "Combined upgrade data",
        description:
          "Preferred endpoint for new tooling. Returns one flat array across mainnets and testnets, with optional filters. By default, only chains with a currently reachable RPC/latest block are returned; pass health=all for raw registry or watched-chain views.",
        parameters: [
          {
            name: "type",
            in: "query",
            description: "Restrict results to mainnet or testnet chains.",
            schema: { type: "string", enum: ["mainnet", "testnet"] },
          },
          {
            name: "health",
            in: "query",
            description:
              "Filter by scan reachability. Defaults to reachable. Use all for registry/debug views.",
            schema: {
              type: "string",
              enum: ["reachable", "unreachable", "all"],
              default: "reachable",
            },
          },
          {
            name: "upgrade_found",
            in: "query",
            description: "Return only chains with or without an active upgrade.",
            schema: { type: "boolean" },
          },
          {
            name: "network",
            in: "query",
            description: "Filter to one chain-registry network id.",
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            description: "Limit the number of records returned.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "A filtered list of upgrade records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ChainUpgrade" },
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameter.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
        description: "Compatibility endpoint returning mainnet scan results only.",
        parameters: [
          {
            name: "health",
            in: "query",
            description: "Filter by scan reachability. Defaults to reachable.",
            schema: {
              type: "string",
              enum: ["reachable", "unreachable", "all"],
              default: "reachable",
            },
          },
        ],
        responses: {
          "200": {
            description: "Mainnet upgrade records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ChainUpgrade" },
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
        description: "Compatibility endpoint returning testnet scan results only.",
        parameters: [
          {
            name: "health",
            in: "query",
            description: "Filter by scan reachability. Defaults to reachable.",
            schema: {
              type: "string",
              enum: ["reachable", "unreachable", "all"],
              default: "reachable",
            },
          },
        ],
        responses: {
          "200": {
            description: "Testnet upgrade records.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ChainUpgrade" },
                },
              },
            },
          },
        },
      },
    },
    "/healthz": {
      get: {
        tags: ["Operations"],
        summary: "Liveness probe",
        description: "Returns 200 while the service is up.",
        responses: {
          "200": {
            description: "Service is healthy.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", examples: ["OK"] } },
                },
              },
            },
          },
        },
      },
    },
    "/metrics": {
      get: {
        tags: ["Operations"],
        summary: "Data freshness and health metrics",
        description:
          "Reports cache freshness, the last successful scan, update-thread health, and fallback availability.",
        responses: {
          "200": {
            description: "Current service metrics.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Metrics" },
              },
            },
          },
        },
      },
    },
    "/admin/api-keys": {
      post: {
        tags: ["Admin"],
        summary: "Manage API keys (operator only)",
        description:
          "Add, revoke, or delete an API key. Requires the X-Admin-Key header; not intended for general clients.",
        security: [{ AdminKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["operation", "key"],
                properties: {
                  operation: {
                    type: "string",
                    enum: ["add", "revoke", "delete"],
                  },
                  key: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Operation result.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "401": { description: "Missing or invalid admin key." },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      AdminKey: { type: "apiKey", in: "header", name: "X-Admin-Key" },
      ApiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
    },
    schemas: {
      ChainUpgrade: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["mainnet", "testnet"],
            description: "Network class.",
          },
          network: { type: "string", description: "Chain-registry network id." },
          latest_block_height: {
            type: ["integer", "null"],
            description: "Latest observed block height.",
          },
          is_reachable: {
            type: "boolean",
            description: "True when the scan reached an RPC and read a current block height.",
          },
          scan_status: {
            type: "string",
            enum: ["reachable", "partial", "unreachable"],
            description:
              "reachable means RPC and REST scan completed; partial means latest block was read but upgrade detection could not run; unreachable means no valid block height was read.",
          },
          upgrade_found: {
            type: "boolean",
            description: "True when an upgrade signal is active.",
          },
          upgrade_name: {
            type: ["string", "null"],
            description: "Detected upgrade name when available.",
          },
          version: {
            type: ["string", "null"],
            description: "Reported upgrade version when available.",
          },
          upgrade_block_height: {
            type: ["integer", "null"],
            description: "Target upgrade block height.",
          },
          estimated_upgrade_time: {
            type: ["string", "null"],
            format: "date-time",
            description: "Estimated upgrade wall-clock time.",
          },
          source: {
            type: ["string", "null"],
            description: "Source of the upgrade signal.",
          },
          rpc_server: {
            type: ["string", "null"],
            description: "RPC endpoint used by the scanner.",
          },
          rest_server: {
            type: ["string", "null"],
            description: "REST endpoint used by the scanner.",
          },
          explorer_url: { $ref: "#/components/schemas/ExplorerUrl" },
          logo_urls: { $ref: "#/components/schemas/LogoUrls" },
        },
      },
      ExplorerUrl: {
        type: ["object", "null"],
        properties: {
          kind: { type: "string" },
          url: { type: "string" },
        },
      },
      LogoUrls: {
        type: ["object", "null"],
        properties: {
          png: { type: "string" },
          svg: { type: "string" },
        },
      },
      Metrics: {
        type: "object",
        properties: {
          status: { type: "string" },
          cache_timeout_seconds: { type: "integer" },
          update_interval_seconds: { type: "integer" },
          last_successful_update: { type: ["string", "null"], format: "date-time" },
          data_age_seconds: { type: ["number", "null"] },
          update_thread_alive: { type: "boolean" },
          has_fallback_mainnet: { type: "boolean" },
          has_fallback_testnet: { type: "boolean" },
          cache_type: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
};
