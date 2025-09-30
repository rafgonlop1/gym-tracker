import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

type LoaderEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export async function loader({ context }: LoaderFunctionArgs<LoaderEnv>) {
  // Prefer Worker env (injected via createRequestHandler), fall back to process.env for local/dev
  const fallbackEnv = typeof process !== "undefined" ? process.env : undefined;
  const env = {
    SUPABASE_URL:
      context?.SUPABASE_URL ||
      context?.VITE_SUPABASE_URL ||
      fallbackEnv?.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY:
      context?.SUPABASE_ANON_KEY ||
      context?.VITE_SUPABASE_ANON_KEY ||
      fallbackEnv?.VITE_SUPABASE_ANON_KEY,
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn(
      "Supabase environment variables are missing. Ensure they are defined in Wrangler (SUPABASE_URL, SUPABASE_ANON_KEY or VITE_* equivalents)."
    );
  }

  return json({ env });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0f19" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.env || {})}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}
