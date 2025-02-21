import { createTRPCProxyClient, CreateTRPCProxyClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "./createAppRouter";

type CreateClientOptions = {
  /** TRPC endpoint URL like `https://keeper.dev.linfra.xyz/trpc`. */
  url: string;
  token: string;
};

/**
 * Creates a tRPC client to talk to a keeper.
 *
 * @param {CreateClientOptions} options See `CreateClientOptions`.
 * @returns {CreateTRPCProxyClient<AppRouter>} A typed tRPC client.
 */
export function createClient({ url, token }: CreateClientOptions): CreateTRPCProxyClient<AppRouter> {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ],
  });
}
