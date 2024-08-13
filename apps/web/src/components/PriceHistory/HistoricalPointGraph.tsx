import React, { useCallback, useMemo } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { localPoint } from "@visx/event";
import { GridColumns, GridRows } from "@visx/grid";
import { scaleLinear, scaleTime } from "@visx/scale";
import { Bar, Line, LinePath } from "@visx/shape";
import { withTooltip } from "@visx/tooltip";
import { bisector, extent, max } from "@visx/vendor/d3-array";
import { timeFormat } from "@visx/vendor/d3-time-format";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { SecondaryCard } from "@/components/core/Card";
import { useEmpires } from "@/hooks/useEmpires";
import { useEthPrice } from "@/hooks/useEthPrice";

export const accentColor = "rgba(0,255, 0, .75)";
export const accentColorDark = "rgba(0,255, 0, .25)";
// accessors
const getDate = (d: HistoricalPointCost) => new Date(d.timestamp * 1000);
const getPointValue = (d: HistoricalPointCost) => d.cost;
const bisectDate = bisector<HistoricalPointCost, Date>((d) => new Date(d.timestamp * 1000)).left;

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
  empire: EEmpire;
};

const tickLabelProps = {
  fill: "rgba(255, 255, 255, 1)",
  fontSize: 12,
  fontFamily: "Silkscreen",
  textAnchor: "middle",
} as const;

export const HistoricalPointGraph: React.FC<SmallHistoricalPointPriceProps> = withTooltip<
  SmallHistoricalPointPriceProps,
  HistoricalPointCost[]
>(
  ({
    width,
    height,
    margin = { top: 40, right: 40, bottom: 40, left: 60 },
    empire,
    tooltipData,
    showTooltip,
    hideTooltip,
    tooltipTop = 0,
    tooltipLeft = 0,
  }) => {
    const {
      tables,
      utils: { weiToUsd },
    } = useCore();
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

      // create the flattened data
      const filledData: HistoricalPointCost[] = [];
      timestampMap.forEach((costs, timestamp) => {
        allEmpires.forEach((empire) => {
          filledData.push({
            timestamp,
            empire,
            cost: Number(costs[empire]),
          });
        });
      });

      return filledData;
    }, [historicalPriceEntities, gameStartTimestamp, ethPrice]);

    const { innerWidth, innerHeight } = useMemo(() => {
      return {
        innerWidth: width - margin.left - margin.right,
        innerHeight: height - margin.top - margin.bottom,
      };
    }, [width, height, margin]);

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

    // tooltip handler
    const handleTooltip = useCallback(
      (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = dateScale.invert(x);
        const index = bisectDate(historicalPriceData, x0, 1);
        const d0 = historicalPriceData[index - 1];
        const d1 = historicalPriceData[index];

        // Find the closest timestamp
        const closestTimestamp =
          x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1.timestamp : d0.timestamp;

        // Get all data points with the same timestamp
        const dataPoints = historicalPriceData.filter((d) => d.timestamp === closestTimestamp);

        showTooltip({
          tooltipData: dataPoints,
          tooltipLeft: x,
          tooltipTop: Math.min(...dataPoints.map((d) => stockValueScale(getPointValue(d)))),
        });
      },
      [showTooltip, stockValueScale, dateScale, historicalPriceData],
    );

    if (width < 10) return null;

    return (
      <div className="pointer-event-auto flex items-center justify-center gap-2 rounded-box bg-black/10">
        <svg width={width} height={height}>
          {empires.entries().map(([empire, data], index) => (
            <LinePath
              key={empire}
              data={historicalPriceData.filter((d) => d.empire === empire)}
              x={(d) => dateScale(getDate(d)) ?? 0}
              y={(d) => stockValueScale(getPointValue(d)) ?? 0}
              strokeWidth={1}
              stroke={data.chartColor}
              curve={curveMonotoneX}
            />
          ))}

          <GridRows
            left={margin.left}
            scale={stockValueScale}
            width={innerWidth}
            strokeDasharray="1,3"
            stroke={accentColor}
            strokeOpacity={0}
            pointerEvents="none"
          />
          <GridColumns
            top={margin.top}
            scale={dateScale}
            height={innerHeight}
            strokeDasharray="1,3"
            stroke={accentColor}
            strokeOpacity={0.2}
            pointerEvents="none"
          />
          <AxisBottom
            top={height - margin.bottom}
            scale={dateScale}
            tickFormat={(v: Date, i: number) => (width > 400 || i % 2 === 0 ? timeFormat("%I:%M")(v) : "")}
            stroke={"rgba(0, 255, 255, .5)"}
            tickStroke={"rgba(0, 255, 255, .5)"}
            tickLabelProps={tickLabelProps}
            numTicks={width > 750 ? 10 : 5}
            label={"time"}
            labelProps={{
              x: width + 30,
              y: -10,
              fontSize: 18,
              strokeWidth: 0,
              stroke: "rgba(0, 255, 255, .5)",
              paintOrder: "stroke",
              fontFamily: "Silkscreen",
              textAnchor: "start",
            }}
          />
          <AxisLeft
            left={margin.left}
            scale={stockValueScale}
            numTicks={5}
            tickFormat={(v: bigint) => `${weiToUsd(v, ethPrice ?? 0)}`}
            stroke={"rgba(0, 255, 255, .5)"}
            tickStroke={"rgba(0, 255, 255, .5)"}
            tickLabelProps={{
              ...tickLabelProps,
              textAnchor: "end",
            }}
          />
          <Bar
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                stroke={"rgba(0, 255, 255, .25)"}
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
            </g>
          )}
        </svg>
        {tooltipData && (
          <div className="absolute right-2 top-2 flex w-fit flex-row gap-1 text-xs">
            {tooltipData.map((d, index) => (
              <SecondaryCard key={index} className="flex flex-col items-end">
                <p className="opacity-50">{EEmpire[d.empire]}</p>
                <p className="text-center">{weiToUsd(BigInt(d.cost), ethPrice ?? 0)} USD</p>
                <p className="opacity-50">{timeFormat("%I:%M %p")(getDate(d))}</p>
              </SecondaryCard>
            ))}
          </div>
        )}
      </div>
    );
  },
);
