import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.COSMOS_UPGRADES_API_BASE_URL ||
  "https://cosmos-upgrades.bryanlabs.net";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const upstream = new URL(
    path.map(encodeURIComponent).join("/"),
    `${API_BASE_URL.replace(/\/+$/, "")}/`
  );
  upstream.search = request.nextUrl.search;

  const response = await fetch(upstream, {
    headers: {
      accept: request.headers.get("accept") || "application/json",
    },
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type":
        response.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
