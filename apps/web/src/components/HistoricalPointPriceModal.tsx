import { useEffect, useMemo, useRef, useState } from "react";
import { PresentationChartLineIcon, StarIcon } from "@heroicons/react/24/solid";
import { axisBottom, axisLeft, curveMonotoneX, line, pointer, scaleLinear, select } from "d3";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { bigintMax, bigintMin } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { Tooltip } from "@/components/core/Tooltip";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

const TICK_LABEL_INTERVAL = 30; // 30 seconds
const PX_PER_SECOND = 3;

export const EmpireEnumToFillColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "stroke-blue-400",
  [EEmpire.Green]: "stroke-green-400",
  [EEmpire.Red]: "stroke-red-400",
  [EEmpire.LENGTH]: "",
};

export const EmpireEnumToTextColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "text-blue-400",
  [EEmpire.Green]: "text-green-400",
  [EEmpire.Red]: "text-red-400",
  [EEmpire.LENGTH]: "",
};

export const HistoricalPointPriceModal = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(EEmpire.LENGTH);

  return (
    <Modal title="Points Price History">
      <Modal.Button className="btn-md h-[58px] w-fit" variant="info">
        <PresentationChartLineIcon className="size-8" />
      </Modal.Button>
      <Modal.Content>
        <RadioGroup
          name="select-empire-chart"
          value={selectedEmpire.toString()}
          options={[
            ...Array.from(new Array(EEmpire.LENGTH))
              .map((_, i) => i + 1)
              .map((empire) => ({
                id: empire.toString(),
                label: empire === EEmpire.LENGTH ? "ALL EMPIRES" : EmpireEnumToName[empire as EEmpire],
              })),
          ]}
          onChange={(value) => setSelectedEmpire(Number(value) as EEmpire)}
        />
        <HistoricalPointPriceChart selectedEmpire={selectedEmpire} />
      </Modal.Content>
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
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? BigInt(0);

  const { sell: sellPointPrice, buy: buyPointPrice } = usePointPrice();
  const cheapestBuyPrice = bigintMin(...Object.values(buyPointPrice));
  const highestSellPrice = bigintMax(...Object.values(sellPointPrice));

  const historicalPriceData = useMemo(() => {
    // get data
    let data = historicalPriceEntities
      .map((entity) => ({
        ...tables.HistoricalPointCost.getEntityKeys(entity), // empire, timestamp
        cost: tables.HistoricalPointCost.get(entity)?.cost ?? BigInt(0),
      }))
      .filter((d) => d.timestamp >= gameStartTimestamp);

    // group items by timestamp
    const groupedData = data.reduce(
      (acc, item) => {
        const key = item.timestamp.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, typeof data>,
    );

    // prepare for filling missing data (no cost for a timestamp means it stays the same as the previous one)
    const allEmpires = Array.from(new Array(EEmpire.LENGTH - 1)).map((_, i) => i + 1);
    const timestampMap = new Map<number, { [key: number]: string }>();

    // grab costs for each timestamp
    Object.entries(groupedData).forEach(([key, items]) => {
      const timestamp = Number(key);
      timestampMap.set(timestamp, {});
      items.forEach((item) => {
        timestampMap.get(timestamp)![item.empire] = item.cost.toString();
      });
    });

    // fill costs for missing timestamps
    allEmpires.forEach((empire) => {
      let previousCost = "0";
      timestampMap.forEach((costs) => {
        if (costs[empire] === undefined) {
          costs[empire] = previousCost;
        } else {
          previousCost = costs[empire];
        }
      });
    });

    // create the flattened data
    const filledData: { timestamp: number; empire: EEmpire; cost: string }[] = [];
    timestampMap.forEach((costs, timestamp) => {
      allEmpires.forEach((empire) => {
        filledData.push({
          timestamp,
          empire,
          cost: costs[empire],
        });
      });
    });

    return filledData;
  }, [historicalPriceEntities, gameStartTimestamp]);

  const latestTimestamp = historicalPriceData.length
    ? historicalPriceData[historicalPriceData.length - 1].timestamp
    : 0;

  useEffect(() => {
    if (!historicalPriceData.length) return;

    const minTimestamp = Math.min(...historicalPriceData.map((d) => Number(d.timestamp)));
    const maxTimestamp = Math.max(...historicalPriceData.map((d) => Number(d.timestamp)));
    const minCost = 0;
    const maxCost = Math.max(...historicalPriceData.map((d) => Number(d.cost)));

    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 80 };
    // approx 3px per second
    const totalWidth = margin.left + margin.right + (maxTimestamp - minTimestamp) * PX_PER_SECOND;

    // create scales
    const xScale = scaleLinear()
      .domain([minTimestamp, maxTimestamp])
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
    // or to have it much less dense
    const tickValues = Array.from(
      { length: (maxTimestamp - minTimestamp) / TICK_LABEL_INTERVAL + 1 },
      (_, i) => minTimestamp + i * TICK_LABEL_INTERVAL,
    );

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
          .tickFormat((d, index) => {
            const date = new Date(Number(d) * 1000);
            // return the date and time if it's the first label
            if (index === 0) return date.toLocaleString("en-US");
            // return the date if it's the first label for a new day
            if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() <= TICK_LABEL_INTERVAL)
              return date.toLocaleDateString("en-US");
            // otherwise return the time
            return date.toLocaleTimeString("en-US");
          }),
      )
      .selectAll("line")
      .style("stroke", "#706f6f")
      .style("stroke-width", 0.5)
      .style("shape-rendering", "crispEdges");

    // create lines for each empire
    const lineGenerator = line<{ timestamp: number; cost: string }>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(Number(d.cost)))
      .curve(curveMonotoneX);

    // draw lines
    Array.from(new Array(EEmpire.LENGTH - 1))
      .map((_, i) => i + 1)
      .forEach((empire) => {
        if (selectedEmpire !== EEmpire.LENGTH && selectedEmpire !== empire) return;

        scrollSvg
          .append("path")
          .datum(historicalPriceData.filter((d) => d.empire === empire))
          .attr("fill", "none")
          .attr("class", EmpireEnumToFillColor[empire as EEmpire])
          .attr("stroke-width", 1.5)
          .attr("d", lineGenerator);
      });

    // draw axis labels
    fixedSvg
      .append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", -height / 2)
      .attr("y", margin.left - 60)
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
      .text("Time")
      .attr("fill", "#706f6f")
      .style("font-size", "14px");

    // Add mouseover effects
    const mouseG = scrollSvg.append("g").attr("class", "mouse-over-effects");

    mouseG
      .append("path") // vertical line to follow mouse
      .attr("class", "mouse-line-vertical")
      .style("stroke", "#706f6f")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    mouseG
      .append("path") // horizontal line to follow mouse
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
        select(".mouse-line-vertical").style("opacity", "0");
        select(".mouse-line-horizontal").style("opacity", "0");
      })
      .on("mouseover", () => {
        select(".mouse-line-vertical").style("opacity", "1");
        select(".mouse-line-horizontal").style("opacity", "1");
      })
      .on("mousemove", function (event) {
        const mouse = pointer(event);
        select(".mouse-line-vertical").attr("d", `M${mouse[0]},${height} ${mouse[0]},0`);
        select(".mouse-line-horizontal").attr("d", `M0,${mouse[1]} ${totalWidth},${mouse[1]}`);
      })
      // and on scroll
      .on("mousewheel", function (event) {
        const mouse = pointer(event);
        select(".mouse-line-vertical").attr("d", `M${mouse[0]},${height} ${mouse[0]},0`);
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
          <h2 className="text-sm font-semibold text-gray-400">Last update</h2>
          <span className="text-sm text-gray-300">
            {new Date(Number(latestTimestamp) * 1000).toLocaleString("en-US")}
          </span>
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
                  Buy Price (USD)
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider text-gray-500">
                  Sell Price (USD)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(buyPointPrice).map(([_empire, buyPrice]) => {
                const empire = _empire as unknown as keyof typeof buyPointPrice;
                const color = EmpireEnumToTextColor[Number(empire) as EEmpire];

                return (
                  <tr key={empire}>
                    <td className={cn("whitespace-nowrap px-4 py-2", color)}>
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
                          {buyPrice === cheapestBuyPrice && <StarIcon className="size-4" title="Cheapest buy price" />}
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
                            <StarIcon className="size-4" title="Highest sell price" />
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
