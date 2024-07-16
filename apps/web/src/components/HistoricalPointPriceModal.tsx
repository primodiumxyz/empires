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
  const gameStartBlock = tables.P_GameConfig.use()?.gameStartBlock ?? BigInt(0);

  const historicalPriceData = useMemo(() => {
    // get data
    let data = historicalPriceEntities
      .map((entity) => ({
        ...tables.HistoricalPointCost.getEntityKeys(entity), // empire, turn
        cost: formatEther(tables.HistoricalPointCost.get(entity)?.cost ?? BigInt(0)),
      }))
      .filter((d) => d.turn >= gameStartBlock);

    // group items by turn
    const groupedData = data.reduce(
      (acc, item) => {
        const key = item.turn.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, typeof data>,
    );

    // prepare for filling missing data (no cost for a turn means it stays the same as the previous turn)
    const allEmpires = Array.from(new Array(EEmpire.LENGTH - 1)).map((_, i) => i + 1);
    const turnMap = new Map<number, { [key: number]: string }>();

    // grab costs for each turn
    Object.entries(groupedData).forEach(([_, items], index) => {
      const turnIndex = index + 1;
      turnMap.set(turnIndex, {});
      items.forEach((item) => {
        turnMap.get(turnIndex)![item.empire] = item.cost;
      });
    });

    // fill costs for missing turns
    allEmpires.forEach((empire) => {
      let previousCost = "0";
      turnMap.forEach((costs) => {
        if (costs[empire] === undefined) {
          costs[empire] = previousCost;
        } else {
          previousCost = costs[empire];
        }
      });
    });

    // create the flattened data
    const filledData: { turnIndex: number; empire: EEmpire; cost: string }[] = [];
    turnMap.forEach((costs, turnIndex) => {
      allEmpires.forEach((empire) => {
        filledData.push({
          turnIndex,
          empire,
          cost: costs[empire],
        });
      });
    });

    return filledData;
  }, [historicalPriceEntities, gameStartBlock]);

  const latestTurn = historicalPriceData.length ? historicalPriceData[historicalPriceData.length - 1].turnIndex : 0;

  useEffect(() => {
    if (!historicalPriceData.length) return;
    console.log(historicalPriceData);

    const minTurn = Math.min(...historicalPriceData.map((d) => Number(d.turnIndex)));
    const maxTurn = Math.max(...historicalPriceData.map((d) => Number(d.turnIndex)));
    const minCost = 0;
    const maxCost = Math.max(...historicalPriceData.map((d) => Number(d.cost)));

    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const totalWidth = margin.left + margin.right + historicalPriceData.length * 10; // approx 10px per turn

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

    // generate integer tick values for the horizontal axis
    const tickValues = Array.from({ length: maxTurn - minTurn + 1 }, (_, i) => minTurn + i);

    // create scrolling horizontal axis and lines
    const scrollSvg = select(scrollSvgRef.current);
    scrollSvg.selectAll("*").remove();
    scrollSvg.attr("width", totalWidth).attr("height", height);

    // draw horizontal axis
    scrollSvg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        axisBottom(xScale)
          .tickValues(tickValues)
          .tickFormat((d) => d.toString()),
      )
      .selectAll("line")
      .style("stroke", "#706f6f")
      .style("stroke-width", 0.5)
      .style("shape-rendering", "crispEdges");

    // create lines for each empire
    const lineGenerator = line<{ turnIndex: number; cost: string }>()
      .x((d) => xScale(d.turnIndex))
      .y((d) => yScale(Number(d.cost)));

    // draw lines
    Array.from(new Array(EEmpire.LENGTH - 1)).forEach((_, _empire) => {
      const empire = _empire + 1;
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
      .text("Turn")
      .attr("fill", "#706f6f")
      .style("font-size", "14px");
  }, [historicalPriceData]);

  return (
    <div className="relative flex flex-col gap-4">
      {historicalPriceData.length > 3 ? (
        <>
          <svg ref={fixedSvgRef} className="absolute left-0"></svg>
          <div className="relative overflow-x-auto">
            <svg ref={scrollSvgRef}></svg>
          </div>
        </>
      ) : (
        "No available activity to display"
      )}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-400">Latest turn</h2>
        <span className="text-sm text-gray-300">{latestTurn}</span>
        <h2 className="text-sm font-semibold text-gray-400">Current point cost</h2>
        <div className="grid grid-cols-[min-content_1fr] gap-x-4 text-sm text-gray-300">
          {/* {latestCosts.map((cost) => (
            <>
              <span>{cost.empire}</span>
              <span>{cost.cost} ETH</span>
            </>
          ))} */}
        </div>
      </div>
    </div>
  );
};
