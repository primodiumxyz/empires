import { useEffect, useMemo, useRef, useState } from "react";
import { PresentationChartLineIcon, StarIcon } from "@heroicons/react/24/solid";
import { axisBottom, axisLeft, line, pointer, scaleLinear, select } from "d3";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { bigintMax, bigintMin } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { Tooltip } from "@/components/core/Tooltip";
import { EmpireEnumToColor } from "@/components/Planet";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

export const HistoricalPointPriceModal = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(EEmpire.LENGTH);

  return (
    <Modal
      icon={<PresentationChartLineIcon className="h-8 w-8 fill-neutral" />}
      buttonClassName="bottom-2 right-12 h-14 w-14"
    >
      <div className="flex flex-col gap-2">
        <h1 className="whitespace-nowrap font-semibold uppercase text-gray-300">Points price history</h1>
        <RadioGroup
          name="select-empire-chart"
          value={selectedEmpire.toString()}
          options={[
            ...Array.from(new Array(EEmpire.LENGTH))
              .map((_, i) => i + 1)
              .map((empire) => ({
                id: empire.toString(),
                // @ts-expect-error Property '[EEmpire.LENGTH]' does not exist on type 'typeof EEmpire'.
                label: empire === EEmpire.LENGTH ? "ALL EMPIRES" : EmpireEnumToName[empire as EEmpire],
              })),
          ]}
          onChange={(value) => setSelectedEmpire(Number(value) as EEmpire)}
        />
      </div>
      <HistoricalPointPriceChart selectedEmpire={selectedEmpire} />
    </Modal>
  );
};

const HistoricalPointPriceChart = ({ selectedEmpire }: { selectedEmpire: EEmpire }) => {
  const {
    tables,
    utils: { ethToUSD },
  } = useCore();
  const { price: ethPrice, loading: loadingEthPrice } = useEthPrice();
  const fixedSvgRef = useRef<SVGSVGElement>(null);
  const scrollSvgRef = useRef<SVGSVGElement>(null);

  const historicalPriceEntities = tables.HistoricalPointCost.useAll();
  const gameStartBlock = tables.P_GameConfig.use()?.gameStartBlock ?? BigInt(0);

  const { sell: sellPointPrice, buy: buyPointPrice } = usePointPrice();
  const cheapestBuyPrice = bigintMin(...Object.values(buyPointPrice));
  const highestSellPrice = bigintMax(...Object.values(sellPointPrice));

  const historicalPriceData = useMemo(() => {
    // get data
    let data = historicalPriceEntities
      .map((entity) => ({
        ...tables.HistoricalPointCost.getEntityKeys(entity), // empire, turn
        cost: tables.HistoricalPointCost.get(entity)?.cost ?? BigInt(0),
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
        turnMap.get(turnIndex)![item.empire] = item.cost.toString();
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
      .call(
        axisLeft(yScale)
          .tickValues(yScale.ticks(5))
          .tickFormat((d) => ethToUSD(BigInt(d.toString()), ethPrice ?? 0) ?? ""),
      )
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
    Array.from(new Array(EEmpire.LENGTH - 1))
      .map((_, i) => i + 1)
      .forEach((empire) => {
        if (selectedEmpire !== EEmpire.LENGTH && selectedEmpire !== empire) return;

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
      .text("Cost (USD)")
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

    // Add mouseover effects
    const mouseG = scrollSvg.append("g").attr("class", "mouse-over-effects");

    mouseG
      .append("path") // black vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "#706f6f")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    mouseG
      .append("path") // black horizontal line to follow mouse
      .attr("class", "mouse-line-horizontal")
      .style("stroke", "#706f6f")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    mouseG
      .append("rect") // append a rect to catch mouse movements on canvas
      .attr("width", totalWidth)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseout", () => {
        select(".mouse-line").style("opacity", "0");
        select(".mouse-line-horizontal").style("opacity", "0");
      })
      .on("mouseover", () => {
        select(".mouse-line").style("opacity", "1");
        select(".mouse-line-horizontal").style("opacity", "1");
      })
      .on("mousemove", function (event) {
        const mouse = pointer(event);
        select(".mouse-line").attr("d", `M${mouse[0]},${height} ${mouse[0]},0`);
        select(".mouse-line-horizontal").attr("d", `M0,${mouse[1]} ${totalWidth},${mouse[1]}`);
      })
      // and on scroll
      .on("mousewheel", function (event) {
        const mouse = pointer(event);
        select(".mouse-line").attr("d", `M${mouse[0]},${height} ${mouse[0]},0`);
        select(".mouse-line-horizontal").attr("d", `M0,${mouse[1]} ${totalWidth},${mouse[1]}`);
      });
  }, [historicalPriceData, selectedEmpire]);

  if (loadingEthPrice || !ethPrice) return <span className="font-medium">Loading...</span>;
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
        <span className="font-medium">No available activity to display</span>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-400">Latest turn</h2>
          <span className="text-sm text-gray-300">{latestTurn}</span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-400">Current points price</h2>
          <table className="min-w-full divide-y divide-gray-700 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  Empire
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  Buy Price (ETH)
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  Sell Price (ETH)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(buyPointPrice).map(([_empire, buyPrice]) => {
                const empire = _empire as unknown as keyof typeof buyPointPrice;
                const color = `text-${EmpireEnumToColor[Number(empire) as EEmpire]}-400`;

                return (
                  <tr key={empire}>
                    <td className={cn("whitespace-nowrap px-4 py-2", color)}>
                      {/* @ts-expect-error Property 'EEmpire' does not exist on type 'typeof EEmpire'. */}
                      {EmpireEnumToName[Number(empire) as EEmpire]}
                    </td>
                    <td className={cn("whitespace-nowrap px-4 py-2", color)}>
                      {!!buyPrice ? (
                        <div className="flex items-center gap-2">
                          <Tooltip
                            tooltipContent={`${formatEther(buyPrice)} ETH`}
                            className="text-gray-300"
                            containerClassName={cn(
                              "w-min cursor-pointer",
                              buyPrice === cheapestBuyPrice && "font-semibold",
                            )}
                          >
                            {ethToUSD(buyPrice, ethPrice)}
                          </Tooltip>
                          {buyPrice === cheapestBuyPrice && (
                            <StarIcon className="h-4 w-4 text-gray-300" title="Cheapest buy price" />
                          )}
                        </div>
                      ) : (
                        "could not retrieve"
                      )}
                    </td>
                    <td className={cn("whitespace-nowrap px-4 py-2", color)}>
                      {!!sellPointPrice[empire] ? (
                        <div className="flex items-center gap-2">
                          <Tooltip
                            tooltipContent={`${formatEther(sellPointPrice[empire])} ETH`}
                            className="text-gray-300"
                            containerClassName={cn(
                              "w-min cursor-pointer",
                              sellPointPrice[empire] === highestSellPrice && "font-semibold",
                            )}
                          >
                            {ethToUSD(sellPointPrice[empire], ethPrice)}
                          </Tooltip>
                          {sellPointPrice[empire] === highestSellPrice && (
                            <StarIcon className="h-4 w-4 text-gray-300" title="Highest sell price" />
                          )}
                        </div>
                      ) : (
                        "can't sell"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
