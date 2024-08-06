import { FC } from "react";

import { Entity } from "@primodiumxyz/reactive-tables";

type SegmentedCapacityBarProps = {
  current: bigint;
  max: bigint | null;
  segments?: number;
  resourceType?: Entity;
  className?: string;
};

export const CapacityBar: FC<SegmentedCapacityBarProps> = ({ current, max, segments = 20, className = "" }) => {
  // Calculate the number of filled segments
  const filledSegments = max !== null && max > 0n ? Math.round((Number(current) / Number(max)) * segments) : 0;

  const segmentColor = (index: number) => {
    // Default color scheme
    const pct = index / segments;
    if (pct < 0.2) return "bg-emerald-800";
    if (pct < 0.4) return "bg-emerald-700";
    if (pct < 0.6) return "bg-emerald-600";
    if (pct < 0.8) return "bg-emerald-500";
    if (pct < 0.9) return "bg-emerald-400";
    return "bg-emerald-300";
  };

  return (
    <div className={`relative flex h-5 gap-0.5 p-0.5 ${className}`}>
      {[...Array(segments)].map((_, index) => (
        <div
          key={index}
          className={`h-full flex-1 transition-all duration-500 ${
            index < filledSegments ? segmentColor(index) : "bg-gray-400/20"
          }`}
        />
      ))}
    </div>
  );
};
