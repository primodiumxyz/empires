import { Address } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";
import { formatAddress } from "@core/utils";

export const createUsernameUtils = (tables: Tables) => {
  const REFRESH_INTERVAL = 1000 * 60 * 60 * 24 * 7; // 7 days
  const NO_TWITTER_REFRESH_INTERVAL = 1000 * 60 * 10; // 10 minutes
  const refreshUsername = async (address: Address, accountLinkUrl?: string) => {
    const addressEntity = address as Entity;
    try {
      let fetchedUsername: string | null = null;
      const res = await fetch(`${accountLinkUrl}/linked-address/twitter/${address}`);
      const content = (await res.json()) as {
        username: string | null;
        address: Address | null;
      };
      if (content.username) {
        fetchedUsername = content.username;
      }
      tables.Username.set(
        {
          username: fetchedUsername ?? formatAddress(address),
          lastFetched: Date.now(),
          hasTwitter: fetchedUsername ? true : false,
        },
        addressEntity,
      );
    } catch (error) {
      console.error(error);
    }
  };
  const getUsername = async (
    address: Address,
    accountLinkUrl?: string,
  ): Promise<{ username: string; hasTwitter: boolean }> => {
    const addressEntity = address as Entity;
    const {
      username: localUsername,
      lastFetched: prevLastFetched,
      hasTwitter: prevHasTwitter,
    } = tables.Username.get(addressEntity) ?? { username: null, lastFetched: 0, hasTwitter: false };

    const shouldRefresh =
      !localUsername ||
      Date.now() - (prevLastFetched ?? 0) > (prevHasTwitter ? REFRESH_INTERVAL : NO_TWITTER_REFRESH_INTERVAL);

    if (shouldRefresh) {
      await refreshUsername(address, accountLinkUrl);
    }
    const { username, hasTwitter } = tables.Username.get(addressEntity) ?? {
      username: null,
      lastFetched: 0,
      hasTwitter: false,
    };

    if (!username) {
      return { username: formatAddress(address), hasTwitter: false };
    }
    return { username, hasTwitter };
  };

  return {
    getUsername,
    refreshUsername,
    usernameSettings: { REFRESH_INTERVAL, NO_TWITTER_REFRESH_INTERVAL },
  };
};
