import { CSSProperties, ReactNode } from "react";
import ReactAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";

export const AutoSizer = <T,>({
  items,
  itemSize,
  render,
}: {
  items: T[];
  itemSize: number;
  render: (item: T, index: number) => ReactNode;
}) => {
  return (
    <ReactAutoSizer>
      {({ height, width }: { height: number; width: number }) => (
        <FixedSizeList height={height} width={width} itemCount={items.length} itemSize={itemSize} className="scrollbar">
          {({ index, style }: { index: number; style: CSSProperties }) => (
            <div key={index} style={style} className="pr-2">
              {render(items[index], index)}
            </div>
          )}
        </FixedSizeList>
      )}
    </ReactAutoSizer>
  );
};
