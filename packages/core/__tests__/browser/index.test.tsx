import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { createCore } from "../../src/createCore";
import { AccountClientProvider, CoreProvider, useCore } from "../../src/react/hooks";
import { useAccountClient } from "../../src/react/hooks/useAccountClient";
import { commonTests, createTestConfig } from "../lib/common";

describe("browser", () => {
  const { coreConfig, address, privateKey } = createTestConfig();

  commonTests();

  describe("browser-only", () => {
    it("should contain core object in a hook", () => {
      const TestCoreComponent = () => {
        const core = useCore();

        return (
          <div>
            <p>{core.config.playerAddress}</p>
          </div>
        );
      };

      const core = createCore(coreConfig);
      core.network.world;

      render(
        <CoreProvider {...core}>
          <TestCoreComponent />
        </CoreProvider>,
      );

      expect(screen.getAllByText(address)[0]).toBeInTheDocument();
    });

    it("should contain account client in a hook", () => {
      const TestCoreComponent = () => {
        const { playerAccount } = useAccountClient();
        return (
          <div>
            <p>{playerAccount.address}</p>
          </div>
        );
      };

      const core = createCore(coreConfig);

      render(
        <CoreProvider {...core}>
          <AccountClientProvider playerPrivateKey={privateKey}>
            <TestCoreComponent />
          </AccountClientProvider>
        </CoreProvider>,
      );
      expect(screen.getAllByText(address)[0]).toBeInTheDocument();
    });
  });
});
