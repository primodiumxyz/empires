import { Hex } from "viem";

import { ChainConfig } from "@primodiumxyz/core";

export class KeeperService {
  private chainConfig: ChainConfig;
  private running: boolean = false;
  private unsubscribe: (() => void) | null = null;

  constructor(chainConfig: ChainConfig) {
    this.chainConfig = chainConfig;
  }

  async start(worldAddress: Hex, initialBlockNumber: bigint): Promise<boolean> {
    if (this.running) await this.stop();

    try {
      this.running = true;
      this.run(worldAddress, initialBlockNumber);
      return true;
    } catch (error) {
      console.error("Failed to start keeper:", error);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (!this.running) return true;

    try {
      if (this.unsubscribe) this.unsubscribe();
      this.running = false;
      return true;
    } catch (error) {
      console.error("Failed to stop keeper:", error);
      return false;
    }
  }

  getStatus(): { running: boolean } {
    return { running: this.running };
  }

  private async run(worldAddress: Hex, initialBlockNumber: bigint) {
    try {
      // TODO: logic here
    } catch (error) {
      console.error("Failed to update world:", error);
    }
  }
}
