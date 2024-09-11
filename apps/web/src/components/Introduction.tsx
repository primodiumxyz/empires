import { useEffect, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Modal } from "@/components/core/Modal";
import { useSettings } from "@/hooks/useSettings";

const STAGGER_DELAY = 500; // milliseconds between each card appearance

export const Intro = () => {
  const ShowIntro = useSettings().ShowIntro;
  const showIntro = ShowIntro.use()?.value ?? true;
  const [cardVisibility, setCardVisibility] = useState([false, false, false]);
  const { tables } = useCore();
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 1;

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
      <Modal.Content className="h-[46rem] max-h-screen w-[50rem] p-6">
        <div className="hide-scrollbar z-50 flex h-full flex-col items-center overflow-scroll p-8">
          <h1 className="mb-6 text-center text-xl text-warning lg:!text-2xl">WELCOME TO PRIMODIUM: EMPIRES</h1>
          <p className="mb-6 text-center text-xs lg:!text-sm">
            IN THIS THRILLING INTERSTELLAR ADVENTURE, YOU WILL COMPETE AMONG{" "}
            <span className="text-accent">{empireCount}</span> EMPIRES TO CONTROL THE MOST CITADELS WHEN THE TIMER ENDS.
            YOU CAN BUY AND SELL SHIPS AND SHIELDS, AND PERFORM SPECIAL ACTIONS TO INFLUENCE THE OUTCOME. STRATEGIZE
            WISELY AND LEAD YOUR EMPIRE TO VICTORY!
          </p>

          <h2 className="mb-4 flex items-center gap-2 text-sm text-accent lg:!text-lg">- HOW TO PLAY -</h2>

          <div className="grid grid-cols-3 gap-2">
            {[
              {
                title: "STRATEGIZE",
                gif: "img/intro/strategize.gif",
                description: "ANALYZE THE GALAXY AND PLAN YOUR MOVES",
              },
              {
                title: "SUPPORT",
                gif: "img/intro/support.gif",
                description: (
                  <>
                    BOOST YOUR EMPIRE BY TAKING ACTIONS ON PLANETS AND EARNING VALUABLE{" "}
                    <span className="text-accent">POINTS</span>.
                  </>
                ),
              },
              {
                title: "WIN",
                gif: "img/intro/win.gif",
                description: (
                  <>
                    SELL <span className="text-accent">POINTS</span> FOR IMMEDIATE REWARDS OR HOLD FOR A BIG WIN IF YOUR
                    EMPIRE TRIUMPHS.
                  </>
                ),
              },
            ].map((item, index) => (
              <SecondaryCard
                key={item.title}
                className={`flex w-full flex-col items-center overflow-hidden p-0 transition-opacity duration-500 ${cardVisibility[index] ? "opacity-100" : "opacity-0"}`}
              >
                <h3 className="absolute m-2 rounded-box bg-gradient-to-t from-black to-transparent px-2 text-sm text-accent lg:!text-lg">
                  {item.title}
                </h3>
                <img src={item.gif} alt={item.title} className="aspect-square h-[300px] object-cover leading-none" />
                <p className="absolute bottom-0 bg-gradient-to-t from-black to-black/50 p-2 text-center text-xs">
                  {item.description}
                </p>
              </SecondaryCard>
            ))}
          </div>

          <Modal.CloseButton
            variant="primary"
            size="md"
            className="mt-6"
            onClick={() => ShowIntro.set({ value: false })}
          >
            BEGIN
          </Modal.CloseButton>
        </div>
      </Modal.Content>
    </Modal>
  );
};
