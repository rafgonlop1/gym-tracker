import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  mode: "production",
  getLoadContext: (context) => {
    // Pasar todo el objeto env de Cloudflare
    return context.env;
  },
});