import { useEffect, useMemo, useState } from "react";

import { Entity } from "@primodiumxyz/reactive-tables";
import { useCore } from "@core/react/hooks/useCore";
import { getEnsName, LinkedAddressResult } from "@core/utils/global/ens";

/**
 * Retrieves the player name and related information.
 *
 * @param playerEntity - The player entity.
 * @param address - Optional boolean flag indicating whether to include the player's address.
 * @returns An object containing the linked address, alliance name, player address, loading state, and player flag.
 */
export function usePlayerName(playerEntity: Entity, address?: boolean) {
  const { config } = useCore();

  const [linkedAddress, setLinkedAddress] = useState<LinkedAddressResult>();
  const [loading, setLoading] = useState(true);

  const name = useMemo(() => {
    if (!linkedAddress) return address;
    return linkedAddress.ensName ?? address;
  }, [linkedAddress, playerEntity, address]);

  useEffect(() => {
    const getAddressObj = async () => {
      const addressObj =
        !playerEntity || !config.accountLinkUrl ? undefined : await getEnsName(config.accountLinkUrl, playerEntity);
      setLinkedAddress(addressObj);
      setLoading(false);
    };
    getAddressObj();
  }, [playerEntity]);

  return {
    linkedAddress,
    address: name,
    loading,
  };
}
