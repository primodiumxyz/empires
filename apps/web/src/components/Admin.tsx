import React, { useState } from "react";
import { ServerIcon } from "@heroicons/react/24/solid";
import { Address, isAddress } from "viem";

import { ERole } from "@primodiumxyz/contracts/config/enums";
import { entityToAddress } from "@primodiumxyz/core";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Dropdown } from "@/components/core/Dropdown";
import { Modal } from "@/components/core/Modal";
import { TextInput } from "@/components/core/TextInput";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useUsername } from "@/hooks/useUsername";
import { cn } from "@/util/client";

export const AdminModal: React.FC = () => {
  const { playerAccount } = usePlayerAccount();
  const address = playerAccount?.address;
  return (
    <Modal title="Cheatcodes">
      <Modal.Button variant="warning">
        <ServerIcon className="size-6" /> ADMIN
      </Modal.Button>
      <Modal.Content className={cn("w-[800px]")}>
        {!address && <div>Login as admin to access this page</div>}
        {address && <_AdminPanel address={address} />}
      </Modal.Content>
    </Modal>
  );
};

const _AdminPanel: React.FC<{ address: Address }> = ({ address }) => {
  const { tables } = useCore();
  const { setRole, removeRole, pause, unpause } = useContractCalls();
  const [newPlayerAddress, setNewPlayerAddress] = useState<string>("");

  const playerRole = tables.Role.useWithKeys({ id: address })?.value ?? 0;

  const allRoles = tables.Role.useAll().reduce(
    (acc, address) => {
      const role = tables.Role.get(address)?.value;
      if (!role) return acc;
      return { ...acc, [address]: role as ERole };
    },
    {} as Record<string, ERole>,
  );
  const handleAddNewRole = async () => {
    if (newPlayerAddress) {
      await setRole(newPlayerAddress as Address, ERole.CanUpdate);
      setNewPlayerAddress("");
    }
  };
  const handlePause = async () => {
    await pause();
  };

  const handleUnpause = async () => {
    await unpause();
  };

  return (
    <SecondaryCard>
      <h2 className="mb-4 text-xs font-bold opacity-50">Admin</h2>
      <p className="text-base">Your Role: {ERole[playerRole] || "None"}</p>
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={handlePause} disabled={playerRole !== ERole.Admin}>
            Pause Game
          </Button>
          <Button onClick={handleUnpause} disabled={playerRole !== ERole.Admin}>
            Unpause Game
          </Button>
        </div>
        <TextInput
          placeholder="add new player role"
          value={newPlayerAddress}
          onChange={(e) => setNewPlayerAddress(e.target.value)}
        />
        <Button onClick={handleAddNewRole} disabled={!isAddress(newPlayerAddress)}>
          Add New Role
        </Button>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th>Player</th>
              <th>Current Role</th>
              <th>New Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(allRoles).map(([playerAddress, role]) => (
              <PlayerRow
                key={playerAddress}
                playerAddress={entityToAddress(playerAddress)}
                role={role}
                disabled={playerRole !== ERole.Admin}
              />
            ))}
          </tbody>
        </table>
      </div>
    </SecondaryCard>
  );
};

const PlayerRow: React.FC<{ playerAddress: Address; role: ERole; disabled: boolean }> = ({
  playerAddress,
  role,
  disabled,
}) => {
  const { setRole, removeRole, pause, unpause } = useContractCalls();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, ERole>>({});
  const { username } = useUsername(playerAddress);

  const handleSetRole = async (playerAddress: string) => {
    if (playerAddress && selectedRoles[playerAddress] !== undefined) {
      await setRole(playerAddress as Address, selectedRoles[playerAddress]);
    }
  };

  const handleRemoveRole = async (playerAddress: string) => {
    if (playerAddress) {
      await removeRole(playerAddress as Address);
    }
  };
  return (
    <tr key={playerAddress}>
      <td>{username}</td>
      <td>{ERole[role]}</td>
      <td>
        <Dropdown
          value={selectedRoles[playerAddress] ?? role}
          onChange={(newRole) => setSelectedRoles((prev) => ({ ...prev, [playerAddress]: newRole }))}
        >
          <Dropdown.Item value={ERole.Admin}>Admin</Dropdown.Item>
          <Dropdown.Item value={ERole.CanUpdate}>Can Update</Dropdown.Item>
        </Dropdown>
      </td>
      <td>
        <Button onClick={() => handleSetRole(playerAddress)} disabled={disabled}>
          Set Role
        </Button>
        <Button onClick={() => handleRemoveRole(playerAddress)} disabled={disabled}>
          Remove Role
        </Button>
      </td>
    </tr>
  );
};
