import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig(async () => {
  let tsconfigPathsPlugin: any = null;
  try {
    const { default: tsconfigPaths } = await import("vite-tsconfig-paths");
    tsconfigPathsPlugin = tsconfigPaths();
  } catch {}

  const rootDir = path.dirname(fileURLToPath(import.meta.url));

  return {
    plugins: [
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_singleFetch: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      ...(tsconfigPathsPlugin ? [tsconfigPathsPlugin] : []),
    ],
    resolve: {
      alias: {
        "~": path.resolve(rootDir, "./app"),
      },
    },
  };
});
