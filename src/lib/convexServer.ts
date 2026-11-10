import { ConvexHttpClient } from "convex/browser";

/** Client Convex per le route del server Next.js (login, token, logout). */
export function convexForServer(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}
