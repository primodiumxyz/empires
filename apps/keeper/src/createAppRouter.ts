import { initTRPC, TRPCError } from "@trpc/server";
import { isAddress } from "viem";
import { z } from "zod";

import { StartKeeperRequest } from "@/types";

import { KeeperService } from "./KeeperService";

export type AppContext = {
  keeperService: KeeperService;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createAppRouter() {
  const t = initTRPC.context<AppContext>().create();

  return t.router({
    startKeeper: t.procedure
      .input(
        z.object({
          worldAddress: z.string(),
          initialBlockNumber: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { worldAddress, initialBlockNumber } = input as StartKeeperRequest;
        if (!isAddress(worldAddress) || !BigInt(initialBlockNumber)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid world address or initial block number",
          });
        }

        const success = await ctx.keeperService.start(worldAddress, BigInt(initialBlockNumber));
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to start keeper process",
          });
        }

        return { success: true };
      }),

    stopKeeper: t.procedure.mutation(async ({ ctx }) => {
      const success = await ctx.keeperService.stop();
      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to stop keeper process",
        });
      }

      return { success: true };
    }),

    getKeeperStatus: t.procedure.query(({ ctx }) => {
      return ctx.keeperService.getStatus();
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
