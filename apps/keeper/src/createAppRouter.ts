import { chainConfigs } from "@core/index";
import { initTRPC, TRPCError } from "@trpc/server";
import { isAddress } from "viem";
import { z } from "zod";

import { KeeperService } from "./KeeperService";

export type AppContext = {
  keeperService: KeeperService;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createAppRouter() {
  const t = initTRPC.context<AppContext>().create();

  return t.router({
    start: t.procedure
      .input(
        z.object({
          chainId: z.string(),
          worldAddress: z.string(),
          initialBlockNumber: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { chainId, worldAddress, initialBlockNumber } = input as {
          chainId: string;
          worldAddress: string;
          initialBlockNumber: string;
        };

        const chain = Object.values(chainConfigs).find((chain) => chain.id === Number(chainId));
        if (!chain) throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid chain ID: ${chainId}` });
        if (!isAddress(worldAddress))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid world address",
          });

        const success = await ctx.keeperService.start(chain, worldAddress, BigInt(initialBlockNumber) ?? 0n);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to start keeper process",
          });
        }

        return { success: true };
      }),

    stop: t.procedure.mutation(async ({ ctx }) => {
      const success = await ctx.keeperService.stop();
      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to stop keeper process",
        });
      }

      return { success: true };
    }),

    getStatus: t.procedure.query(({ ctx }) => {
      return ctx.keeperService.getStatus();
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
