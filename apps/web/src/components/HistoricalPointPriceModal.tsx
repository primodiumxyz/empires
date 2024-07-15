import React, { Dispatch, forwardRef, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { PresentationChartLineIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { axisBottom, axisLeft, line, scaleLinear, scaleTime, select } from "d3";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireEnumToColor } from "@/components/Planet";
import { cn } from "@/util/client";

export const HistoricalPointPriceModal = () => {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeModal = (e: MouseEvent) => {
      if (!open || !modalRef.current || !buttonRef.current) return;
      if (!modalRef.current.contains(e.target as Node) && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", closeModal);
    return () => document.removeEventListener("click", closeModal);
  }, [open]);

  return (
    <>
      {/* open button */}
      <OpenModalButton ref={buttonRef} setOpen={setOpen} className={open ? "hidden" : ""} />
      {/* overlay */}
      <div
        className={cn(
          "absolute h-[95%] w-[95%] rounded-btn bg-gray-950 bg-opacity-90 md:h-[90%] md:w-[90%]",
          !open && "hidden",
        )}
      />
      {/* modal */}
      <div
        ref={modalRef}
        className={cn(
          "absolute flex h-[95%] w-[95%] flex-col gap-2 py-4 pl-4 pr-2 md:h-[90%] md:w-[90%]",
          !open && "hidden",
        )}
      >
        {/* close button */}
        <CloseModalButton setOpen={setOpen} />
        {/* cheatcodes */}
        <h1 className="font-semibold uppercase text-gray-300">Points price history</h1>
        <div className="grid grid-cols-1 gap-4 overflow-auto pr-2 md:grid-cols-2 lg:grid-cols-3">
          <HistoricalPointPriceChart />
        </div>
      </div>
    </>
  );
};

const HistoricalPointPriceChart = () => {
  const { tables } = useCore();
  const svgRef = useRef<SVGSVGElement>(null);

  const historicalPriceEntities = tables.HistoricalPointCost.useAll();
  const historicalPriceData = useMemo(() => {
    const data = historicalPriceEntities.map((entity) => ({
      ...tables.HistoricalPointCost.getEntityKeys(entity), // empire, turn
      cost: formatEther(tables.HistoricalPointCost.get(entity)?.cost ?? BigInt(0)),
    }));

    // group by turn block number and assign index
    const groupedData = data.reduce(
      (acc, item) => {
        const key = item.turn.toString() as keyof typeof acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, typeof data>,
    );

    let index = 1;
    const indexedData = Object.keys(groupedData).flatMap((key) => {
      const items = groupedData[key];
      const grouped = items.map((item) => ({
        cost: item.cost,
        empire: item.empire,
        turnBlockNumber: item.turn,
        turnIndex: index,
      }));

      index++;
      return grouped;
    });

    return indexedData;
  }, [historicalPriceEntities]);

  useEffect(() => {
    if (!historicalPriceData.length) return;
    console.log(historicalPriceData);

    const minTurn = Math.min(...historicalPriceData.map((d) => Number(d.turnIndex)));
    const maxTurn = Math.max(...historicalPriceData.map((d) => Number(d.turnIndex)));
    const minCost = 0;
    const maxCost = Math.max(...historicalPriceData.map((d) => Number(d.cost)));
    console.log({ minTurn, maxTurn, minCost, maxCost });

    const svg = select(svgRef.current);
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const xScale = scaleLinear()
      .domain([minTurn, maxTurn])
      .range([margin.left, width - margin.right]);

    const yScale = scaleLinear()
      .domain([minCost, maxCost])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.selectAll("*").remove();

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(axisBottom(xScale).ticks(width / 80));

    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(axisLeft(yScale));

    const lineGenerator = line<{ turn: bigint; cost: bigint }>()
      .x((d: (typeof historicalPriceData)[number]) => xScale(Number(d.turnIndex)))
      .y((d: (typeof historicalPriceData)[number]) => yScale(Number(d.cost)));

    [1, 2, 3].forEach((empire) => {
      svg
        .append("path")
        .datum(historicalPriceData.filter((d) => d.empire === empire))
        .attr("fill", "none")
        .attr("stroke", EmpireEnumToColor[empire as EEmpire])
        .attr("stroke-width", 1.5)
        .attr("d", lineGenerator);
    });
  }, [historicalPriceData]);

  return <svg ref={svgRef} width={800} height={400}></svg>;
};

type ModalButtonProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
  className?: string;
};

const OpenModalButton = forwardRef<HTMLButtonElement, ModalButtonProps>(({ setOpen, className }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "absolute bottom-2 right-12 flex h-14 w-14 cursor-pointer items-center justify-center rounded-btn bg-white opacity-70 transition-opacity hover:opacity-100",
        className,
      )}
      onClick={() => setOpen(true)}
    >
      <PresentationChartLineIcon className="h-8 w-8 fill-neutral" />
    </button>
  );
});

export const CloseModalButton = ({ setOpen, className }: ModalButtonProps) => (
  <button
    className={cn("absolute right-2 top-2 rounded-btn bg-neutral p-2 transition-colors hover:bg-primary", className)}
    onClick={() => setOpen(false)}
  >
    <XCircleIcon className="h-6 w-6" />
  </button>
);
