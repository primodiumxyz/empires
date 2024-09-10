import { useEffect, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Modal } from "@/components/core/Modal";
import { useSettings } from "@/hooks/useSettings";

const STAGGER_DELAY = 500; // milliseconds between each card appearance

export const Intro = () => {
  const ShowIntro = useSettings().ShowIntro;
  const showIntro = ShowIntro.use()?.value ?? true;
  const [cardVisibility, setCardVisibility] = useState([false, false, false]);

  useEffect(() => {
    if (showIntro) {
      const timers = cardVisibility.map((_, index) =>
        setTimeout(
          () => {
            setCardVisibility((prev) => {
              const newVisibility = [...prev];
              newVisibility[index] = true;
              return newVisibility;
            });
          },
          STAGGER_DELAY * (index + 1),
        ),
      );

      return () => timers.forEach((timer) => clearTimeout(timer));
    }
  }, [showIntro]);

  return (
    <Modal title="Introduction" startOpen={showIntro} onClose={() => ShowIntro.set({ value: false })}>
      <Modal.Content className="w-[50rem] p-6">
        <div className="z-50 flex flex-col items-center p-8">
          <h1 className="mb-6 text-center text-xl text-warning">WELCOME TO PRIMODIUM: EMPIRES</h1>
          <p className="mb-6 text-center text-sm">
            IN THIS THRILLING INTERSTELLAR ADVENTURE, YOU WILL COMPETE AMONG SIX EMPIRES TO CONTROL THE MOST CITADELS
            WHEN THE TIMER ENDS. YOU CAN BUY AND SELL SHIPS AND SHIELDS, AND PERFORM SPECIAL ACTIONS TO INFLUENCE THE
            OUTCOME. STRATEGIZE WISELY AND LEAD YOUR EMPIRE TO VICTORY!
          </p>

          <h2 className="mb-4 text-lg text-accent">HOW TO PLAY</h2>

          <div className="flex justify-between gap-4">
            {[
              {
                title: "STRATEGIZE",
                icon: InterfaceIcons.Starmap,
                description: "ANALYZE THE GALAXY AND PLAN YOUR MOVES",
              },
              {
                title: "SUPPORT",
                icon: InterfaceIcons.Alliance,
                description: "BOOST YOUR EMPIRE BY TAKING ACTIONS ON PLANETS AND EARNING VALUABLE POINTS.",
              },
              {
                title: "WIN",
                icon: InterfaceIcons.Leaderboard,
                description: "SELL POINTS FOR IMMEDIATE REWARDS OR HOLD FOR A BIG WIN IF YOUR EMPIRE TRIUMPHS.",
              },
            ].map((item, index) => (
              <SecondaryCard
                key={item.title}
                className={`flex w-1/3 flex-col items-center p-4 transition-opacity duration-500 ${cardVisibility[index] ? "opacity-100" : "opacity-0"}`}
              >
                <h3 className="mb-2 text-lg">{item.title}</h3>
                <img src={item.icon} alt={item.title} className="mb-2 h-32 w-32" />
                <p className="text-center text-xs">{item.description}</p>
              </SecondaryCard>
            ))}
          </div>

          <Button variant="primary" size="lg" className="mt-6" onClick={() => ShowIntro.set({ value: false })}>
            BEGIN
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  );
};
