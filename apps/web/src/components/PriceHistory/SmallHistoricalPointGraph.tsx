import React, { useCallback, useMemo } from "react";
import { curveMonotoneX } from "@visx/curve";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { GridColumns, GridRows } from "@visx/grid";
import appleStock, { AppleStock } from "@visx/mock-data/lib/mocks/appleStock";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, Bar, Line } from "@visx/shape";
import { bisector, extent, max } from "@visx/vendor/d3-array";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { cn } from "@/util/client";

const stock = appleStock.slice(800);
export const accentColor = "rgba(0,255, 0, .75)";
export const accentColorDark = "rgba(0,255, 0, .25)";
// accessors
const getDate = (d: HistoricalPointCost) => new Date(d.timestamp * 1000);
const getPointValue = (d: HistoricalPointCost) => d.cost;

export type SmallHistoricalPointPriceProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  empire: EEmpire;
  windowSize?: number;
};

type HistoricalPointCost = {
  timestamp: number;
  cost: number;
};

export const SmallHistoricalPointGraph: React.FC<SmallHistoricalPointPriceProps> = ({
  width,
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
  empire,
  windowSize = 25,
}) => {
  const { tables } = useCore();

  const historicalPriceEntities = tables.HistoricalPointCost.useAll();
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;

  const historicalPriceData = useMemo(() => {
    // get data
    let data = historicalPriceEntities
      .map((entity) => ({
        ...tables.HistoricalPointCost.getEntityKeys(entity), // empire, timestamp
        cost: tables.HistoricalPointCost.get(entity)?.cost ?? BigInt(0),
      }))
      .filter((d) => d.timestamp >= gameStartTimestamp)
      .filter((d) => d.empire === empire);

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
    // const allEmpires = Array.from(new Array(EEmpire.LENGTH - 1)).map((_, i) => i + 1);
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
    let previousCost = 0n;
    timestampMap.forEach((costs) => {
      if (costs[empire] === undefined) {
        costs[empire] = previousCost;
      } else {
        previousCost = costs[empire];
      }
    });

    // create the flattened data
    const filledData: HistoricalPointCost[] = [];
    timestampMap.forEach((costs, timestamp) => {
      filledData.push({
        timestamp,
        cost: Number(costs[empire]),
      });
    });

    // only return the last windowSize items
    return filledData.slice(-windowSize);
  }, [historicalPriceEntities, gameStartTimestamp]);

  const [colorFrom, colorTo, percentChange] = useMemo(() => {
    const diff = historicalPriceData[historicalPriceData.length - 1].cost - historicalPriceData[0].cost;
    const percentChange = (diff / historicalPriceData[0].cost) * 100;

    if (diff >= 0) return ["rgba(0,255, 0, .75)", "rgba(0,255, 0, .25)", percentChange];
    return ["rgba(255, 0, 0, .75)", "rgba(255, 0, 0, .25)", percentChange];
  }, [historicalPriceData]);

  if (width < 10) return null;

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // scales
  const dateScale = useMemo(
    () =>
      scaleTime({
        range: [margin.left, innerWidth + margin.left],
        domain: extent(historicalPriceData, getDate) as [Date, Date],
      }),
    [innerWidth, margin.left, historicalPriceData],
  );
  const stockValueScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight + margin.top, margin.top],
        domain: [0, (max(historicalPriceData, getPointValue) || 0) + innerHeight / 3],
        nice: true,
      }),
    [margin.top, innerHeight, historicalPriceData],
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <svg width={width} height={height}>
        <LinearGradient id={`area-gradient-${empire}`} from={colorFrom} to={colorTo} toOpacity={0.1} />
        <AreaClosed
          data={historicalPriceData}
          x={(d) => dateScale(getDate(d)) ?? 0}
          y={(d) => stockValueScale(getPointValue(d)) ?? 0}
          yScale={stockValueScale}
          strokeWidth={1}
          stroke={`url(#area-gradient-${empire})`}
          fill={`url(#area-gradient-${empire})`}
          curve={curveMonotoneX}
        />
      </svg>
      <div className={cn("text-xs", Math.sign(percentChange) >= 0 ? "text-success" : "text-error")}>
        {percentChange.toFixed(2)}%
      </div>
    </div>
  );
};
