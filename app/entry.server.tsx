/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import reactDomServer from "react-dom/server";

const { renderToReadableStream } = reactDomServer;

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof renderToReadableStream === "function") {
        const stream = await renderToReadableStream(
          <RemixServer
            context={remixContext}
            url={request.url}
            abortDelay={ABORT_DELAY}
          />,
          {
            onError(error: unknown) {
              responseStatusCode = 500;
              console.error(error);
            },
          }
        );

        await stream.allReady;

        responseHeaders.set("Content-Type", "text/html");
        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          })
        );
        return;
      }

      if (typeof (reactDomServer as any).renderToPipeableStream === "function") {
        // Node.js fallback: stream via renderToPipeableStream
        // Use dynamic import to avoid bundling Node builtins in edge builds
        const { PassThrough } = await import(/* @vite-ignore */ "node:stream").then((m: any) => m);
        const body = new PassThrough();

        const { pipe, abort } = (reactDomServer as any).renderToPipeableStream(
          <RemixServer
            context={remixContext}
            url={request.url}
            abortDelay={ABORT_DELAY}
          />,
          {
            onAllReady() {
              responseHeaders.set("Content-Type", "text/html");
              resolve(
                new Response(body as any, {
                  headers: responseHeaders,
                  status: responseStatusCode,
                })
              );
              pipe(body);
            },
            onError(error: unknown) {
              responseStatusCode = 500;
              console.error(error);
            },
          }
        );
        setTimeout(abort, ABORT_DELAY);
        return;
      }

      // Last resort: render to string (sync)
      if (typeof (reactDomServer as any).renderToString === "function") {
        const markup = (reactDomServer as any).renderToString(
          <RemixServer
            context={remixContext}
            url={request.url}
            abortDelay={ABORT_DELAY}
          />
        );
        responseHeaders.set("Content-Type", "text/html");
        resolve(
          new Response(markup, {
            headers: responseHeaders,
            status: responseStatusCode,
          })
        );
        return;
      }

      throw new Error("No compatible React SSR renderer found.");
    } catch (error) {
      reject(error);
    }
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof renderToReadableStream === "function") {
        const stream = await renderToReadableStream(
          <RemixServer
            context={remixContext}
            url={request.url}
            abortDelay={ABORT_DELAY}
          />,
          {
            onError(error: unknown) {
              responseStatusCode = 500;
              console.error(error);
            },
          }
        );

        await stream.allReady;

        responseHeaders.set("Content-Type", "text/html");
        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          })
        );
        return;
      }

      if (typeof (reactDomServer as any).renderToPipeableStream === "function") {
        const { PassThrough } = await import(/* @vite-ignore */ "node:stream").then((m: any) => m);
        const body = new PassThrough();

        const { pipe, abort } = (reactDomServer as any).renderToPipeableStream(
          <RemixServer
            context={remixContext}
            url={request.url}
            abortDelay={ABORT_DELAY}
          />,
          {
            onAllReady() {
              responseHeaders.set("Content-Type", "text/html");
              resolve(
                new Response(body as any, {
                  headers: responseHeaders,
                  status: responseStatusCode,
                })
              );
              pipe(body);
            },
            onError(error: unknown) {
              responseStatusCode = 500;
              console.error(error);
            },
          }
        );
        setTimeout(abort, ABORT_DELAY);
        return;
      }

      if (typeof (reactDomServer as any).renderToString === "function") {
        const markup = (reactDomServer as any).renderToString(
          <RemixServer
            context={remixContext}
            url={request.url}
            abortDelay={ABORT_DELAY}
          />
        );
        responseHeaders.set("Content-Type", "text/html");
        resolve(
          new Response(markup, {
            headers: responseHeaders,
            status: responseStatusCode,
          })
        );
        return;
      }

      throw new Error("No compatible React SSR renderer found.");
    } catch (error) {
      reject(error);
    }
  });
}
