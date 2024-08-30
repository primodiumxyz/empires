import React, { useMemo, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { formatEther, toHex } from "viem";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { entityToAddress } from "@primodiumxyz/core";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { AutoSizer } from "@/components/core/AutoSizer";
import { Button } from "@/components/core/Button";
import { Join } from "@/components/core/Join";
import { Modal } from "@/components/core/Modal";
import { Tabs } from "@/components/core/Tabs";
import ImageUploader from "@/components/leaderboard/ImageUploader";
import { Price } from "@/components/shared/Price";
import { Username } from "@/components/shared/Username";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

export const Leaderboard = () => {
  return (
    <Modal title="Top Point Holders">
      <Modal.Button size="md" tooltip="Top Point Holders" tooltipDirection="bottom">
        <img src={InterfaceIcons.Leaderboard} alt="Leaderboard" className={`pixel-images w-[2em]`} draggable="false" />
      </Modal.Button>
      <Modal.Content className="h-[600px] w-[550px]">
        <LeaderboardContent />
      </Modal.Content>
    </Modal>
  );
};

const LeaderboardContent = () => {
  const empires = useEmpires();
  const {
    ROOT: { sprite },
  } = useGame();

  const { tables } = useCore();
  const { SelectedTab } = useSettings();
  const persistKey = toHex("leaderboard") as Entity;
  const selectedTab = SelectedTab.use(persistKey)?.value ?? 0;

  return (
    <Tabs className="flex h-full w-full gap-1" persistIndexKey={"leaderboard"} defaultIndex={0}>
      <Join direction="vertical" className="rounded-r">
        <Tabs.Button key={"all"} index={0} size="md" className="w-16">
          ALL
        </Tabs.Button>
        {Array.from(empires.entries()).map(([id, emp], i) => {
          const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[id] ?? "PlanetGrey");
          return (
            <Tabs.Button key={emp.name} index={i + 1} size="md">
              <img src={spriteUrl} className="w-6" />
              {/* <p>{emp.name}</p> */}
            </Tabs.Button>
          );
        })}
      </Join>
      <Tabs.Pane key={"ALL"} index={0} className="w-full">
        <TotalLeaderboard />
      </Tabs.Pane>
      {Array.from(empires.entries()).map(([empireId, empire], i) => {
        return (
          <Tabs.Pane key={empireId} index={i + 1} className="w-full">
            <EmpireLeaderboard empireId={empireId} />
          </Tabs.Pane>
        );
      })}
    </Tabs>
  );
};

const TotalLeaderboard = () => {
  const { tables } = useCore();
  const empires = [...useEmpires().keys()];
  const [refresh, setRefresh] = useState(0);
  const { playerAccount } = usePlayerAccount();

  const handleRefresh = () => {
    setRefresh(refresh + 1);
  };
  const {
    ROOT: { sprite },
  } = useGame();

  const playerData = useMemo(() => {
    const players = tables.Value_PlayersMap.getAll();
    const unsorted = players.reduce(
      (acc, player) => {
        const playerData = tables.Value_PlayersMap.getWithKeys({ playerId: player });
        const profit = (playerData?.gain ?? 0n) - (playerData?.loss ?? 0n);

        empires.map((empireId) => {
          const points = tables.Value_PointsMap.getWithKeys({ playerId: player, empireId })?.value ?? 0n;
          if (points === 0n) return;
          const key = `${player}-${empireId}`;

          acc[key] = {
            player,
            empire: empireId,
            points,
            profit,
          };
        });
        return acc;
      },
      {} as Record<string, { player: Entity; profit: bigint; points: bigint; empire: EEmpire }>,
    );

    const sorted = Object.values(unsorted).sort((a, b) => Number(b.points) - Number(a.points));

    // Add rank to the sorted data
    let currentRank = 1;
    let previousPoints = sorted[0]?.points ?? 0n;

    return sorted.map((item, index) => {
      if (item.points < previousPoints) {
        currentRank = index + 1;
        previousPoints = item.points;
      }
      return { ...item, rank: currentRank } as {
        player: Entity;
        profit: bigint;
        points: bigint;
        empire: EEmpire;
        rank: number;
      };
    });
  }, [refresh]);

  return (
    <div className="pointer-events-auto relative flex h-full w-full flex-col overflow-y-hidden pr-4 text-xs">
      <Button onClick={handleRefresh} className="absolute right-0 top-0" size="xs" shape="square">
        <ArrowPathIcon className="w-4" />
      </Button>
      <div className={`grid w-full grid-cols-[4rem_1fr_1fr_1fr] place-items-center items-end py-2 font-bold uppercase`}>
        <div>Rank</div>
        <div className="">Name</div>
        <div className="opacity-80">Points</div>
        <div className="opacity-80">Profit</div>
      </div>
      <hr className="my-1 border-secondary/50" />
      <div className="h-full w-full">
        <AutoSizer
          itemSize={30}
          items={playerData}
          render={(item, index) => (
            <div
              className={cn(
                "pointer-events-auto grid h-full grid-cols-[4rem_1fr_1fr_1fr] flex-col place-items-center justify-between text-xs",
                item.player === playerAccount?.entity && "rounded bg-primary/40",
              )}
            >
              <div>{item.rank}</div>
              <Username address={entityToAddress(item.player)} />
              <div className={cn("flex items-center gap-2")}>
                <img src={sprite.getSprite(EmpireToPlanetSpriteKeys[item.empire] ?? "PlanetGrey")} className="w-4" />
                <p>{formatEther(item.points)}</p>
              </div>
              <div className={cn("flex items-center gap-2")}>
                <Price wei={item.profit} className={cn("text-sm text-success", item.profit < 0n && "text-error")} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
};

const EmpireLeaderboard = ({ empireId }: { empireId: EEmpire }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const [refresh, setRefresh] = useState(0);
  const { playerAccount } = usePlayerAccount();

  const handleRefresh = () => {
    setRefresh(refresh + 1);
  };

  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empireId] ?? "PlanetGrey");
  const playerData = useMemo(() => {
    const players = tables.Value_PlayersMap.getAll();
    const unsorted = players.reduce(
      (acc, player) => {
        const points = tables.Value_PointsMap.getWithKeys({ playerId: player, empireId })?.value ?? 0n;
        if (points === 0n) return acc;
        acc[player] = {
          player,
          points,
        };
        return acc;
      },
      {} as Record<Entity, { player: Entity; points: bigint }>,
    );

    const sorted = Object.values(unsorted).sort((a, b) => Number(b.points) - Number(a.points));

    // Add rank to the sorted data
    let currentRank = 1;
    let previousPoints = sorted[0]?.points ?? 0n;

    return sorted.map((item, index) => {
      if (item.points < previousPoints) {
        currentRank = index + 1;
        previousPoints = item.points;
      }
      return { ...item, rank: currentRank };
    });
  }, [refresh]);

  return (
    <div className="pointer-events-auto relative flex h-full w-full flex-col overflow-y-hidden pr-4 text-xs">
      <Button onClick={handleRefresh} className="absolute right-0 top-0" size="xs" shape="square">
        <ArrowPathIcon className="w-4" />
      </Button>
      <HomePage empireId={empireId} />
      {playerData.length > 0 ? (
        <>
          <div className={`grid w-full grid-cols-[4rem_1fr_1fr] place-items-center items-end py-2 font-bold uppercase`}>
            <div>Rank</div>
            <div className="">Name</div>
            <div className="opacity-80">Empire Points</div>
          </div>
          <hr className="my-1 border-secondary/50" />
          <div className="h-full w-full">
            <AutoSizer
              itemSize={30}
              items={playerData}
              render={(item) => (
                <div
                  className={cn(
                    "pointer-events-auto grid h-full grid-cols-[4rem_1fr_1fr] flex-col place-items-center justify-between text-xs",
                    item.player === playerAccount?.entity && "rounded bg-primary/40",
                  )}
                >
                  <div>{item.rank}</div>
                  <Username address={entityToAddress(item.player)} />
                  <div className={cn("flex items-center gap-2")}>
                    <img src={spriteUrl} className="w-4" />
                    <p>{formatEther(item.points)}</p>
                  </div>
                </div>
              )}
            />
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">No players hold this empire</div>
      )}
    </div>
  );
};

const HomePage: React.FC<{ empireId: EEmpire }> = ({ empireId }) => {
  const { config } = useCore();
  const [image, setImage] = useState<File | null>(null);

  const url = `${config.accountLinkUrl}/empire-logo/${empireId}?worldAddress=1`;

  const handleImageFetch = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], "empire_logo.png", { type: "image/png" });
      setImage(file);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const handleImageSubmit = async (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    formData.append("worldAddress", "1");

    try {
      const response = await fetch(url, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();
      console.log({ data, response });
      if (response.ok) {
        console.log("Image uploaded successfully");
      } else {
        console.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="mb-4 text-2xl font-bold">Upload Planet Image</h1>
      {image && <img src={URL.createObjectURL(image)} alt="Uploaded" />}
      <Button onClick={handleImageFetch}>Fetch Current Image</Button>
      <ImageUploader onSubmit={handleImageSubmit} />
    </div>
  );
};

export default HomePage;
