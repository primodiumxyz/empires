import { createRef, CSSProperties, ReactNode, useEffect } from "react";
import ReactAutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";

export const AutoSizer = <T,>({
  items,
  itemSize,
  render,
  scrollToBottom,
}: {
  items: T[];
  itemSize: number;
  render: (item: T, index: number) => ReactNode;
  scrollToBottom?: boolean;
}) => {
  const listRef = createRef<FixedSizeList>();

  useEffect(() => {
    if (scrollToBottom && listRef.current) {
      listRef.current.scrollToItem(items.length - 1, "end");
    }
  }, [items, scrollToBottom]);

  return (
    <ReactAutoSizer>
      {({ height, width }: { height: number; width: number }) => (
        <FixedSizeList
          ref={listRef}
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={itemSize}
          className="scroll-smooth"
        >
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
