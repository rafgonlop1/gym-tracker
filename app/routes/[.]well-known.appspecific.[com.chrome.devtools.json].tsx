import { json } from "@remix-run/cloudflare";

export const loader = async () => {
  return json({
    workspace: {
      root: "/",
      uuid: "f9d1b3e0-f3c1-4b3a-9e1a-8a5d1b7e4d5f",
    },
  });
};
