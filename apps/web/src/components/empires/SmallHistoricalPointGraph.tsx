import React, { useMemo } from "react";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed } from "@visx/shape";
import { extent, max } from "@visx/vendor/d3-array";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { cn } from "@/util/client";

export const accentColor = "rgba(0,255, 0, .75)";
export const accentColorDark = "rgba(0,255, 0, .25)";
// accessors
const getDate = (d: HistoricalPointPrice) => new Date(d.timestamp * 1000);
const getPointValue = (d: HistoricalPointPrice) => d.price;

export type SmallHistoricalPointPriceProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  empire: EEmpire;
  windowSize?: number;
};

type HistoricalPointPrice = {
  timestamp: number;
  price: number;
};

export const SmallHistoricalPointGraph: React.FC<SmallHistoricalPointPriceProps> = ({
  width,
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
  empire,
  windowSize = 25,
}) => {
  const { tables } = useCore();

  const historicalPriceEntities = tables.HistoricalPointPrice.useAll();
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;

  const historicalPriceData = useMemo(() => {
    // get data
    let data = historicalPriceEntities
      .map((entity) => ({
        ...tables.HistoricalPointPrice.getEntityKeys(entity), // empire, timestamp
        price: tables.HistoricalPointPrice.get(entity)?.price ?? BigInt(0),
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
    const timestampMap = new Map<number, { [key: number]: bigint }>();

    // grab prices for each timestamp
    Object.entries(groupedData).forEach(([key, items]) => {
      const timestamp = Number(key);
      timestampMap.set(timestamp, {});
      items.forEach((item) => {
        timestampMap.get(timestamp)![item.empire] = item.price;
      });
    });

    // fill costs for missing timestamps
    let previousPrice = 0n;
    timestampMap.forEach((prices) => {
      if (prices[empire] === undefined) {
        prices[empire] = previousPrice;
      } else {
        previousPrice = prices[empire];
      }
    });

    // create the flattened data
    const filledData: HistoricalPointPrice[] = [];
    timestampMap.forEach((prices, timestamp) => {
      filledData.push({
        timestamp,
        price: Number(prices[empire]),
      });
    });

    // only return the last windowSize items
    return filledData.slice(-windowSize);
  }, [historicalPriceEntities, gameStartTimestamp]);

  const [colorFrom, colorTo, percentChange] = useMemo(() => {
    if (historicalPriceData.length < 2) return ["rgba(0,255, 0, .75)", "rgba(0,255, 0, .25)", 0];
    const diff = historicalPriceData[historicalPriceData.length - 1].price - historicalPriceData[0].price;
    const percentChange = (diff / historicalPriceData[0].price) * 100;

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
    <div className="flex max-h-[75vh] flex-col items-center justify-center overflow-auto">
      <div className={cn("hidden text-xs lg:block", Math.sign(percentChange) >= 0 ? "text-success" : "text-error")}>
        {formatNumber(percentChange, { fractionDigits: 1 })}%
      </div>

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
    </div>
  );
};
