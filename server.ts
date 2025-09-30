import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

type Env = {
  NODE_ENV?: string;
  ASSETS?: { fetch: typeof fetch };
  [key: string]: unknown;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const handler = createRequestHandler({
        build,
        mode: (env.NODE_ENV ?? "production") as "production" | "development",
        getLoadContext({ env: loadEnv }) {
          return loadEnv;
        },
      });

      const response = await handler(request, env, ctx);

      if (response.status === 404 && env.ASSETS?.fetch) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status < 500) {
          return assetResponse;
        }
      }

      return response;
    } catch (error) {
      console.error("Unhandled error in worker fetch:", error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      return new Response("Internal Error", { status: 500 });
    }
  },
};
