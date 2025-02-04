import React, { SVGProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { ColorType, createChart, IChartApi, ISeriesApi, LineStyle, LineType, Time } from "lightweight-charts";

import { EEmpire } from "@primodiumxyz/contracts";
import { CHART_TIME_SCALES } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { allEmpires as _allEmpires } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Tooltip } from "@/components/core/Tooltip";
import { useEthPrice } from "@/hooks/useEthPrice";
import { EmpireEnumToConfig } from "@/util/lookups";

export type SmallHistoricalPointPriceProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  empire: EEmpire;
  windowSize?: number;
};

type HistoricalPointPrice = {
  time: Time;
  value: number;
  empire: EEmpire;
};

/**
 * `getHistoricalPriceData` - get historical price data from a set of price data entities (all empires)
 * `formatCandlestickData` - get formatted data for candlesticks (the selected empire) `initialHistoricalPriceData` -
 * base historical data on mount `initialCandlestickData` - base candlestick data on mount `chartContainerRef` -
 * reference to the chart container `seriesRefs` - references to the series
 *
 * 1. Get base historical data on mount (& candlestick data if an empire is selected)
 * 2. Setup live updates to the chart (on new entities)
 *
 * - We're doing that to prevent rerendering the chart on every update (which would reset zoom, pan, etc.)
 * - Meaning that on each update, we need to recalculate the whole data to get average top/bottom values
 * - And save the data received for the next updates
 */
export const HistoricalPointGraph: React.FC<{
  empire: EEmpire;
  tickInterval: number;
}> = ({ empire, tickInterval }) => {
  const {
    tables,
    utils: { weiToUsd },
  } = useCore();
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;
  const ethPrice = useEthPrice().price;
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;

  // Get historical price data from entities, used on mount and to get updates
  const getHistoricalPriceData = useCallback(
    (entities: Entity[]) => {
      const allEmpires = _allEmpires.slice(0, empireCount);
      const data = entities
        .map((entity) => ({
          ...tables.HistoricalPointPrice.getEntityKeys(entity), // empire, timestamp
          price: tables.HistoricalPointPrice.get(entity)?.price ?? BigInt(0),
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

      // grab prices for each timestamp
      Object.entries(groupedData).forEach(([key, items]) => {
        const timestamp = Number(key);
        timestampMap.set(timestamp, {});
        items.forEach((item) => {
          timestampMap.get(timestamp)![item.empire] = item.price;
        });
      });

      // fill prices for missing timestamps
      allEmpires.forEach((empire) => {
        let previousPrice = 0n;
        timestampMap.forEach((prices) => {
          if (prices[empire] === undefined) {
            prices[empire] = previousPrice;
          } else {
            previousPrice = prices[empire];
          }
        });
      });

      // create the data
      const empireData = Object.fromEntries(allEmpires.map((empire) => [empire, []])) as unknown as Record<
        EEmpire,
        HistoricalPointPrice[]
      >;
      timestampMap.forEach((prices, timestamp) => {
        allEmpires.forEach((empire) => {
          empireData[empire as EEmpire].push({
            time: timestamp as Time,
            empire,
            value: Number(prices[empire]),
          });
        });
      });

      return empireData;
    },
    [gameStartTimestamp, ethPrice, empireCount],
  );

  // Get formatted data for candlesticks
  const formatCandlestickData = useCallback(
    (historicalPriceData: Record<EEmpire, HistoricalPointPrice[]>) => {
      if (!historicalPriceData[empire] || historicalPriceData[empire].length === 0) {
        return [];
      }

      const data = historicalPriceData[empire].reduce(
        (acc, item) => {
          const tickIndex = Math.floor(Number(item.time) / tickInterval);

          if (!acc[tickIndex]) {
            acc[tickIndex] = {
              time: (tickIndex * tickInterval) as Time,
              open: item.value, // we'll handle this next
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

      // Make sure each tick opens at the close of the previous tick (in case there are gaps in time)
      const ticks = Object.values(data);
      const alignedTicks = ticks.map((item, index) => {
        if (index === 0) return item;
        return {
          ...item,
          open: ticks[index - 1].close,
        };
      });

      return alignedTicks;
    },
    [empire, tickInterval],
  );

  // Price data for line graphs & generating candlestick data
  const initialHistoricalPriceData = useMemo(
    () => getHistoricalPriceData(tables.HistoricalPointPrice.getAll()),
    [empire, getHistoricalPriceData],
  );

  // Additional data received from updates
  const [updateHistoricalPriceData, setUpdateHistoricalPriceData] = useState<Record<
    EEmpire,
    HistoricalPointPrice[]
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

    const firstDataTime = new Date(Number(gameStartTimestamp) * 1000);
    const lastDataTime = new Date(
      (initialHistoricalPriceData[1][initialHistoricalPriceData[1].length - 1].time as number) * 1000,
    );

    // Create the base chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: "white",
        fontFamily: "Silkscreen",
        fontSize: 11,
        background: { type: ColorType.Solid, color: "transparent" },
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "transparent" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    // Apply chart formatting & layout options
    chart.applyOptions({
      localization: {
        priceFormatter: (price: number) => weiToUsd(BigInt(price.toFixed(0)), ethPrice ?? 0, { precision: 3 }),
        timeFormatter: (time: number, locale: string) => {
          // Show date as well if the game spans multiple days
          const firstDay = firstDataTime.toLocaleDateString();
          const lastDay = lastDataTime.toLocaleDateString();
          if (firstDay === lastDay) return new Date(time * 1000).toLocaleTimeString();

          return new Date(time * 1000).toLocaleString(locale, {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        },
      },
      timeScale: {
        timeVisible: true,
        tickMarkFormatter: (time: number) => new Date(time * 1000).toLocaleTimeString(),
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

      // If there is few data, unzoom the chart a bit so candles are not huge
      const minTicks = 30;
      if (candlestickData.length < minTicks) {
        chart.timeScale().setVisibleLogicalRange({
          from: (lastDataTime.getTime() - 40_000) / 1000,
          to: lastDataTime.getTime() / 1000,
        });
        // scroll so latest data is on the right
        chart.timeScale().scrollToPosition(0, false);
      } else {
        chart.timeScale().fitContent();
      }
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
  }, [empire, tickInterval, initialHistoricalPriceData]);

  // Live updates to the chart (we could go with recreating the component on ever update, but this would reset
  // zoom, pan, etc. )
  // This is a listener on individual entities, meaning associated with a specific empire
  // so we only want to update this empire (since the rest will be 0 and reset the accurate data possibly updated previously)
  useEffect(() => {
    const unsubscribe = tables.HistoricalPointPrice.watch(
      {
        onEnter: ({ entity }) => {
          const { empire: entityEmpire } = tables.HistoricalPointPrice.getEntityKeys(entity) as { empire: EEmpire };
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
            ) as Record<EEmpire, HistoricalPointPrice[]>;

            const candlestickData = formatCandlestickData(fullHistoricalPriceData);
            const updateData = candlestickData?.[candlestickData.length - 1];
            if (updateData) seriesRefs.current?.[0].update(updateData);

            setUpdateHistoricalPriceData(
              (prev) =>
                ({ ...prev, [entityEmpire]: { ...prev?.[entityEmpire], ...newData[entityEmpire] } }) as Record<
                  EEmpire,
                  HistoricalPointPrice[]
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
      <div className="mb-2 flex items-center gap-1 self-end pr-1">
        <TradingViewLogo
          color="#2962ff"
          className="size-6 fill-white opacity-75 transition-opacity hover:opacity-100"
        />
        {CHART_TIME_SCALES.map((scale) => (
          <Button key={scale.value} size="xs" variant="ghost" onClick={() => setTimeScale(scale.value)}>
            {scale.label}
          </Button>
        ))}
        <Tooltip tooltipContent="Resize visible chart to time range" direction="right" className="ml-1 w-44 text-xs">
          <InformationCircleIcon className="size-4 opacity-75" />
        </Tooltip>
      </div>
    </>
  );
};

const TradingViewLogo = (props: SVGProps<SVGSVGElement>, color: string) => (
  <a
    href="https://www.tradingview.com/"
    title="Charting by TradingView"
    target="_blank"
    rel="noreferrer"
    className="mr-2 cursor-pointer"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" {...props}>
      <path d="m74.268 158.688 142.479.023.759 179.45-72.04-.504-.021-107.674-71.245-.112.068-71.183Z" />
      <circle cx={270.59} cy={192.178} r={35.956} />
      <path d="m343.41 158.808 83.007.088-75.185 177.96-82.128-.177 73.733-177.728z" />
    </svg>
  </a>
);
