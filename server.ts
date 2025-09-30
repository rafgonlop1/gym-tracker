import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

type Env = {
  NODE_ENV?: string;
  [key: string]: unknown;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      const handler = createRequestHandler({
        build,
        mode: (env.NODE_ENV ?? "production") as "production" | "development",
        getLoadContext() {
          return env;
        },
      });

      return await handler(request, env, ctx);
    } catch (error) {
      console.error(error);
      return new Response("Internal Error", { status: 500 });
    }
  },
};
