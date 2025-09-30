import type { EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import ReactDOMServer from "react-dom/server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const renderStream =
    // Prefer modern streaming API when available
    (ReactDOMServer as unknown as { renderToReadableStream?: typeof import("react-dom/server").renderToReadableStream })
      .renderToReadableStream;

  if (!renderStream) {
    // Dev fallback for Node environments: try renderToPipeableStream to preserve Suspense
    const pipeable = (ReactDOMServer as unknown as { renderToPipeableStream?: Function }).renderToPipeableStream;
    if (typeof pipeable === "function") {
      // Dynamically import Node stream helpers only when running in Node
      const { PassThrough, Readable } = await import("node:stream");

      return await new Promise<Response>((resolve, reject) => {
        let didError = false as boolean;
        const headers = new Headers(responseHeaders);
        headers.set("Content-Type", "text/html");

        const stream = new PassThrough();

        const onError = (error: unknown) => {
          didError = true;
          console.error(error);
        };

        const { pipe } = (pipeable as any)(
          <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
          {
            onShellReady() {
              // Convert Node stream to Web ReadableStream for Response
              const webStream = (Readable as any).toWeb(stream as any);
              resolve(
                new Response(webStream as any, {
                  headers,
                  status: didError ? 500 : responseStatusCode,
                })
              );
            },
            onShellError: onError,
            onError,
          }
        );

        pipe(stream);
      });
    }

    // Last resort fallback where streaming isn't available
    const html = ReactDOMServer.renderToString(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />
    );
    responseHeaders.set("Content-Type", "text/html");
    return new Response("<!DOCTYPE html>" + html, {
      headers: responseHeaders,
      status: responseStatusCode,
    });
  }

  const body = await renderStream(
    <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
    {
      signal: AbortSignal.timeout(ABORT_DELAY),
      onError(error: unknown) {
        responseStatusCode = 500;
        console.error(error);
      },
    }
  );

  if (isbot(request.headers.get("user-agent") ?? "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
