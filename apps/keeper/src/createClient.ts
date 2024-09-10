import {
  createTRPCProxyClient,
  httpBatchLink,
  CreateTRPCProxyClient,
} from '@trpc/client';
import type { AppRouter } from './createAppRouter';

type CreateClientOptions = {
  /**
   * tRPC endpoint URL like `https://keeper.dev.linfra.xyz/trpc`.
   */
  url: string;
};

/**
 * Creates a tRPC client to talk to a keeper.
 *
 * @param {CreateClientOptions} options See `CreateClientOptions`.
 * @returns {CreateTRPCProxyClient<AppRouter>} A typed tRPC client.
 */
export function createClient({
  url,
}: CreateClientOptions): CreateTRPCProxyClient<AppRouter> {
  return createTRPCProxyClient<AppRouter>({
    links: [httpBatchLink({ url })],
  });
}
