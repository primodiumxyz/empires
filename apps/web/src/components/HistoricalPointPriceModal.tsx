import { useEffect, useMemo, useRef, useState } from "react";
import { PresentationChartLineIcon } from "@heroicons/react/24/solid";
import { axisBottom, axisLeft, line, scaleLinear, select } from "d3";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Modal } from "@/components/core/Modal";
import { EmpireEnumToColor } from "@/components/Planet";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

export const HistoricalPointPriceModal = () => {
  return (
    <Modal
      icon={<PresentationChartLineIcon className="h-8 w-8 fill-neutral" />}
      buttonClassName="bottom-2 right-12 h-14 w-14"
    >
      <h1 className="font-semibold uppercase text-gray-300">Points price history</h1>
      <HistoricalPointPriceChart />
    </Modal>
  );
};

const HistoricalPointPriceChart = () => {
  const { tables } = useCore();
  const fixedSvgRef = useRef<SVGSVGElement>(null);
  const scrollSvgRef = useRef<SVGSVGElement>(null);

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
        cost: item.cost.toString(),
        empire: item.empire,
        turnBlockNumber: item.turn,
        turnIndex: index,
      }));

      index++;
      return grouped;
    });

    return indexedData;
  }, [historicalPriceEntities]);

  const latestTurn = historicalPriceData.length
    ? {
        blockNumber: historicalPriceData[historicalPriceData.length - 1].turnBlockNumber.toLocaleString(),
        index: historicalPriceData[historicalPriceData.length - 1].turnIndex,
      }
    : { blockNumber: "0", index: 0 };
  const latestCosts = tables.Faction.useAll().map((entity) => ({
    empire: EmpireEnumToName[Number(entity) as EEmpire],
    cost: formatEther(tables.Faction.get(entity)?.pointCost ?? BigInt(0)),
  }));

  useEffect(() => {
    if (!historicalPriceData.length) return;
    console.log(historicalPriceData);

    const minTurn = Math.min(...historicalPriceData.map((d) => Number(d.turnIndex)));
    const maxTurn = Math.max(...historicalPriceData.map((d) => Number(d.turnIndex)));
    const minCost = 0;
    const maxCost = Math.max(...historicalPriceData.map((d) => Number(d.cost)));

    const totalWidth = historicalPriceData.length * 10; // approx 10px per turn
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    // create scales
    const xScale = scaleLinear()
      .domain([minTurn, maxTurn])
      .range([margin.left, totalWidth - margin.right]);
    const yScale = scaleLinear()
      .domain([minCost, maxCost])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // create fixed vertical axis
    const fixedSvg = select(fixedSvgRef.current);
    fixedSvg.selectAll("*").remove();
    fixedSvg.attr("width", margin.left + 30).attr("height", height);

    // draw vertical axis
    fixedSvg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(axisLeft(yScale).ticks(height / 80))
      .selectAll("line")
      .style("stroke", "#706f6f")
      .style("stroke-width", 0.5)
      .style("shape-rendering", "crispEdges");

    fixedSvg
      .selectAll(".axis path")
      .style("stroke", "#706f6f")
      .style("stroke-width", 0.7)
      .style("shape-rendering", "crispEdges");

    // create scrolling horizontal axis and lines
    const scrollSvg = select(scrollSvgRef.current);
    scrollSvg.selectAll("*").remove();
    scrollSvg.attr("width", totalWidth).attr("height", height);

    // draw horizontal axis
    scrollSvg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(axisBottom(xScale).ticks(totalWidth / 80))
      .selectAll("line")
      .style("stroke", "#706f6f")
      .style("stroke-width", 0.5)
      .style("shape-rendering", "crispEdges");

    // create lines for each empire
    const lineGenerator = line<{ turnIndex: number; cost: string }>()
      .x((d) => xScale(d.turnIndex))
      .y((d) => yScale(Number(d.cost)));

    // draw lines
    [1, 2, 3].forEach((empire) => {
      scrollSvg
        .append("path")
        .datum(historicalPriceData.filter((d) => d.empire === empire))
        .attr("fill", "none")
        .attr("stroke", EmpireEnumToColor[empire as EEmpire])
        .attr("stroke-width", 1.5)
        .attr("d", lineGenerator);
    });

    // draw axis labels
    fixedSvg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", -height / 2)
      .attr("y", margin.left - 50)
      .attr("transform", "rotate(-90)")
      .text("Cost (ETH)")
      .attr("fill", "#706f6f")
      .style("font-size", "14px");

    scrollSvg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", totalWidth / 2)
      .attr("y", height - 10)
      .text("Turn Index")
      .attr("fill", "#706f6f")
      .style("font-size", "14px");
  }, [historicalPriceData]);

  return (
    <div className="relative flex flex-col gap-4">
      <svg ref={fixedSvgRef} className="absolute left-0"></svg>
      <div className="relative overflow-x-auto">
        <svg ref={scrollSvgRef}></svg>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-400">Latest turn</h2>
        <span className="text-sm text-gray-300">
          {latestTurn.index} (at block {latestTurn.blockNumber})
        </span>
        <h2 className="text-sm font-semibold text-gray-400">Current point cost</h2>
        <div className="grid grid-cols-[min-content_1fr] gap-x-4 text-sm text-gray-300">
          {latestCosts.map((cost) => (
            <>
              <span>{cost.empire}</span>
              <span>{cost.cost} ETH</span>
            </>
          ))}
        </div>
      </div>
    </div>
  );
};
