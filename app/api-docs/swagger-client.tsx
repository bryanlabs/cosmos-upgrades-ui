"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/openapi";

// Co-locates the heavy Swagger UI bundle and its CSS so they only load on the
// API docs route (loaded via next/dynamic from the explorer).
export default function SwaggerClient() {
  return (
    <SwaggerUI
      spec={openApiSpec}
      deepLinking
      docExpansion="list"
      defaultModelsExpandDepth={-1}
      persistAuthorization
      tryItOutEnabled
      supportedSubmitMethods={["get"]}
    />
  );
}
