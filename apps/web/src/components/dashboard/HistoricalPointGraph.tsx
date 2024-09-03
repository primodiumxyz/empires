import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForwardIcon } from "@heroicons/react/24/solid";
import { ColorType, createChart, IChartApi, ISeriesApi, LineStyle, LineType, Time } from "lightweight-charts";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { CHART_TIME_SCALES } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { allEmpires as _allEmpires } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button, buttonVariants } from "@/components/core/Button";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

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

/**
 * `getHistoricalPriceData` - get historical price data from a set of price data entities (all empires)
 * `formatCandlestickData` - get formatted data for candlesticks (the selected empire)
 * `initialHistoricalPriceData` - base historical data on mount
 * `initialCandlestickData` - base candlestick data on mount
 * `chartContainerRef` - reference to the chart container
 * `seriesRefs` - references to the series
 *
 * 1. Get base historical data on mount (& candlestick data if an empire is selected)
 * 2. Setup live updates to the chart (on new entities)
 *   - we're doing that to prevent rerendering the chart on every update (which would reset zoom, pan, etc.)
 *   - meaning that on each update, we need to recalculate the whole data to get average top/bottom values
 *   - and save the data received for the next updates
 */
export const HistoricalPointGraph: React.FC<{
  empire: EEmpire;
  tickInterval: number;
}> = ({ empire, tickInterval }) => {
  const {
    tables,
    utils: { weiToUsd },
  } = useCore();
  const { ShowBlockchainUnits, FontStyle } = useSettings();
  const showBlockchainUnits = ShowBlockchainUnits.use()?.value ?? false;
  const fontFamily = FontStyle.use()?.familyRaw ?? "Silkscreen";
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;
  const ethPrice = useEthPrice().price;
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;

  // Get historical price data from entities, used on mount and to get updates
  const getHistoricalPriceData = useCallback(
    (entities: Entity[]) => {
      const allEmpires = _allEmpires.slice(0, empireCount);
      const data = entities
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
    },
    [gameStartTimestamp, ethPrice, empireCount],
  );

  // Get formatted data for candlesticks
  const formatCandlestickData = useCallback(
    (historicalPriceData: Record<EEmpire, HistoricalPointCost[]>) => {
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
    },
    [empire, tickInterval],
  );

  // Price data for line graphs & generating candlestick data
  const initialHistoricalPriceData = useMemo(
    () => getHistoricalPriceData(tables.HistoricalPointCost.getAll()),
    [empire, getHistoricalPriceData],
  );

  // Additional data received from updates
  const [updateHistoricalPriceData, setUpdateHistoricalPriceData] = useState<Record<
    EEmpire,
    HistoricalPointCost[]
  > | null>(null);

  // Chart
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line" | "Candlestick">[] | null>(null);

  // Set time scale on selection
  const setTimeScale = (timeScale: number) => {
    if (!chartRef.current) return;

    const now = new Date().getTime() / 1000;
    const from = timeScale === -1 ? 0 : now - timeScale;
    chartRef.current.timeScale().setVisibleRange({ from: from as Time, to: now as Time });
  };

  // Initialize the chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    seriesRefs.current = [];

    // Create the base chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: "white",
        fontFamily,
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
    chartRef.current = chart;
    chart.timeScale().fitContent();

    // Apply chart formatting & layout options
    chart.applyOptions({
      localization: {
        priceFormatter: (price: number) =>
          showBlockchainUnits
            ? formatEther(BigInt(price.toFixed(0)))
            : weiToUsd(BigInt(price.toFixed(0)), ethPrice ?? 0, { precision: 3, forcePrecision: true }),
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

    // Add series & populate with base data (on mount)
    if (empire === EEmpire.LENGTH) {
      Object.entries(initialHistoricalPriceData).forEach(([_empire, data]) => {
        const empire = Number(_empire) as EEmpire;
        const newSeries = chart.addLineSeries({
          color: EmpireEnumToConfig[empire].chartColor,
          lineType: LineType.Curved,
        });
        newSeries.setData(data);
        seriesRefs.current?.push(newSeries);
      });
    } else {
      const newSeries = chart.addCandlestickSeries({
        // accent
        upColor: "#22d3ee",
        // error
        downColor: "#A8375D",
        borderVisible: false,
        wickUpColor: "#22d3ee",
        wickDownColor: "#A8375D",
      });

      const candlestickData = formatCandlestickData(initialHistoricalPriceData);
      newSeries.setData(candlestickData);
      seriesRefs.current?.push(newSeries);
    }

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current?.clientWidth ?? 0,
        height: chartContainerRef.current?.clientHeight ?? 0,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [empire, tickInterval, initialHistoricalPriceData, fontFamily, showBlockchainUnits]);

  // Live updates to the chart (we could go with recreating the component on ever update, but this would reset
  // zoom, pan, etc. )
  // This is a listener on individual entities, meaning associated with a specific empire
  // so we only want to update this empire (since the rest will be 0 and reset the accurate data possibly updated previously)
  useEffect(() => {
    const unsubscribe = tables.HistoricalPointCost.watch(
      {
        onEnter: ({ entity }) => {
          const { empire: entityEmpire } = tables.HistoricalPointCost.getEntityKeys(entity) as { empire: EEmpire };
          const newData = getHistoricalPriceData([entity]);

          if (empire === EEmpire.LENGTH) {
            const updateData = newData[entityEmpire][0];
            // Price will be 0 if this data is filled (not the update we're interested in)
            if (updateData.value === 0) return;
            seriesRefs.current?.[entityEmpire - 1].update(updateData);
          } else {
            if (entityEmpire !== empire) return;
            // We need the full data to be able to form low/high values for the candlestick
            const fullHistoricalPriceData = Object.fromEntries(
              Object.entries(initialHistoricalPriceData).map(([key, value]) => [
                key,
                [
                  ...value,
                  ...Object.values(updateHistoricalPriceData?.[Number(key) as EEmpire] ?? []),
                  ...newData[Number(key) as EEmpire],
                ],
              ]),
            ) as Record<EEmpire, HistoricalPointCost[]>;

            const candlestickData = formatCandlestickData(fullHistoricalPriceData);
            const updateData = candlestickData?.[candlestickData.length - 1];
            if (updateData) seriesRefs.current?.[0].update(updateData);

            setUpdateHistoricalPriceData(
              (prev) =>
                ({ ...prev, [entityEmpire]: { ...prev?.[entityEmpire], ...newData[entityEmpire] } }) as Record<
                  EEmpire,
                  HistoricalPointCost[]
                >,
            );
          }
        },
      },
      { runOnInit: false },
    );

    return () => unsubscribe();
  }, [
    empire,
    tickInterval,
    initialHistoricalPriceData,
    updateHistoricalPriceData,
    getHistoricalPriceData,
    formatCandlestickData,
  ]);

  return (
    <>
      <div ref={chartContainerRef} className="relative h-full min-h-64 w-full" />
      <div className="flex gap-1 self-end pr-1">
        {CHART_TIME_SCALES.map((scale) => (
          <Button key={scale.value} size="xs" variant="ghost" onClick={() => setTimeScale(scale.value)}>
            {scale.label}
          </Button>
        ))}
        <Button size="xs" variant="ghost" onClick={() => chartRef.current?.timeScale().scrollToRealTime()}>
          <ForwardIcon className="size-4" />
        </Button>
      </div>
    </>
  );
};
