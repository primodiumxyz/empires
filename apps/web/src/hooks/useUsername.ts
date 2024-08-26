import { useMemo } from "react";
import { Address, isAddress } from "viem";

import { formatAddress } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export const useUsername = (address: Address) => {
  const { utils, tables } = useCore();

  const addressEntity = address as Entity;
  const {
    username: localUsername,
    lastFetched,
    hasTwitter,
  } = tables.Username.use(addressEntity) ?? { username: null, lastFetched: 0, hasTwitter: false };

  const time = tables.Time.use();

  useMemo(async () => {
    const refreshInterval = hasTwitter
      ? utils.usernameSettings.REFRESH_INTERVAL
      : utils.usernameSettings.NO_TWITTER_REFRESH_INTERVAL;
    const valid = isAddress(address);
    const shouldRefresh = !localUsername || Date.now() - (lastFetched ?? 0) > refreshInterval;

    if (shouldRefresh && valid) {
      await utils.refreshUsername(address, import.meta.env.PRI_ACCOUNT_LINK_VERCEL_URL);
    } else if (shouldRefresh && !valid) {
      console.error("Invalid address", address);
    }
  }, [address, time, localUsername, lastFetched, hasTwitter]);

  return {
    username: localUsername ?? formatAddress(address),
    hasTwitter,
  };
};
