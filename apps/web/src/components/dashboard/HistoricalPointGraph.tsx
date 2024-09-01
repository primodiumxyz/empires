import React, { useEffect, useMemo, useRef } from "react";
import { curveMonotoneX } from "@visx/curve";
import { ColorType, createChart, LineStyle, LineType, Time } from "lightweight-charts";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Card, SecondaryCard } from "@/components/core/Card";
import { useEmpires } from "@/hooks/useEmpires";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useSettings } from "@/hooks/useSettings";
import { EmpireConfig, EmpireEnumToConfig } from "@/util/lookups";

export const accentColor = "rgba(0,255, 0, .75)";
export const accentColorDark = "rgba(0,255, 0, .25)";

export type SmallHistoricalPointPriceProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  empire: EEmpire;
  windowSize?: number;
};

type HistoricalPointCost = {
  time: Time;
  value: number;
  empire: EEmpire;
};

const tickLabelProps = {
  fill: "rgba(255, 255, 255, 1)",
  fontSize: 12,
  fontFamily: "Silkscreen",
  textAnchor: "middle",
} as const;

export const HistoricalPointGraph: React.FC<{ empire: EEmpire; candlesticks: boolean; tickInterval: number }> = ({
  empire,
  candlesticks,
  tickInterval,
}) => {
  const {
    tables,
    utils: { weiToUsd },
  } = useCore();
  const { showBlockchainUnits, fontStyle } = useSettings();
  const historicalPriceEntities = tables.HistoricalPointCost.useAll();
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;
  const ethPrice = useEthPrice().price;
  const empires = useEmpires();
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
    const allEmpires = Array.from(new Array(empires.size)).map((_, i) => i + 1);
    const timestampMap = new Map<number, { [key: number]: bigint }>();

    // grab costs for each timestamp
    Object.entries(groupedData).forEach(([key, items]) => {
      const timestamp = Number(key);
      timestampMap.set(timestamp, {});
      items.forEach((item) => {
        timestampMap.get(timestamp)![item.empire] = item.cost;
      });
    });

    // fill costs for missing timestamps
    allEmpires.forEach((empire) => {
      let previousCost = 0n;
      timestampMap.forEach((costs) => {
        if (costs[empire] === undefined) {
          costs[empire] = previousCost;
        } else {
          previousCost = costs[empire];
        }
      });
    });

    // create the data
    const empireData = Object.fromEntries(allEmpires.map((empire) => [empire, []])) as unknown as Record<
      EEmpire,
      HistoricalPointCost[]
    >;
    timestampMap.forEach((costs, timestamp) => {
      allEmpires.forEach((empire) => {
        empireData[empire as EEmpire].push({
          time: timestamp as Time,
          empire,
          value: Number(costs[empire]),
        });
      });
    });

    return empireData;
  }, [historicalPriceEntities, gameStartTimestamp, ethPrice]);

  const candlestickData = useMemo(() => {
    if (!historicalPriceData[empire] || historicalPriceData[empire].length === 0) {
      return [];
    }

    const data = historicalPriceData[empire].reduce(
      (acc, item) => {
        const tickIndex = Math.floor(Number(item.time) / tickInterval);

        if (!acc[tickIndex]) {
          acc[tickIndex] = {
            time: (tickIndex * tickInterval) as Time,
            open: item.value,
            high: item.value,
            low: item.value,
            close: item.value,
          };
        } else {
          acc[tickIndex].high = Math.max(acc[tickIndex].high, item.value);
          acc[tickIndex].low = Math.min(acc[tickIndex].low, item.value);
          acc[tickIndex].close = item.value;
        }

        return acc;
      },
      {} as Record<number, { time: Time; open: number; high: number; low: number; close: number }>,
    );

    return Object.values(data);
  }, [historicalPriceData, empire]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 0,
        height: chartContainerRef.current?.clientHeight ?? 0,
      });
    };

    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: "white",
        fontFamily: fontStyle.familyRaw,
        fontSize: 11,
        background: { type: ColorType.Solid, color: "transparent" },
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "transparent" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chart.timeScale().fitContent();

    chart.applyOptions({
      localization: {
        priceFormatter: (price: number) =>
          showBlockchainUnits.enabled
            ? formatEther(BigInt(price.toFixed(0)))
            : weiToUsd(BigInt(price.toFixed(0)), ethPrice ?? 0),
      },
      timeScale: {
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: "#22d3ee",
          style: LineStyle.Solid,
          labelBackgroundColor: "#22d3ee",
        },
        horzLine: {
          color: "#22d3ee",
          labelBackgroundColor: "#22d3ee",
        },
      },
    });

    if (empire === EEmpire.LENGTH) {
      Object.entries(historicalPriceData).forEach(([_empire, data]) => {
        const empire = Number(_empire) as EEmpire;
        const newSeries = chart.addLineSeries({
          color: EmpireEnumToConfig[empire].chartColor,
          lineType: LineType.Curved,
        });
        newSeries.setData(data);
      });
    } else {
      const newSeries = candlesticks
        ? chart.addCandlestickSeries()
        : chart.addLineSeries({
            color: EmpireEnumToConfig[empire].chartColor,
            lineType: LineType.Curved,
          });
      newSeries.setData(candlesticks ? candlestickData : historicalPriceData[empire]);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [empires, empire, historicalPriceData, candlesticks]);

  return <div ref={chartContainerRef} className="h-full min-h-64 w-full" />;
};
