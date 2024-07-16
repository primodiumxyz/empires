import { createContext, FC, memo, ReactNode, useContext, useEffect, useRef, useState } from "react";

import { IconLabel } from "@/components/core/IconLabel";

import { Button as _Button } from "./Button";
import { SecondaryCard } from "./Card";

interface TabProps {
  children?: ReactNode;
  defaultIndex?: number;
  className?: string;
  onChange?: (index?: number) => void;
  persistIndexKey?: string;
}

interface IndexContextValue {
  index: number | undefined;
  setIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
  persistIndexKey?: string;
}

//TODO: Works for now. Move into a simple localStorage hook down the line.
const persistedIndexMap = new Map<string, number | undefined>();
const IndexContext = createContext<IndexContextValue | undefined>(undefined);

const useIndex = (): IndexContextValue => {
  const context = useContext(IndexContext);
  if (!context) {
    throw new Error("useIndex must be used within Tabs");
  }
  return context;
};

const Pane: FC<{
  index?: number;
  className?: string;
  children: ReactNode;
  fragment?: boolean;
}> = memo(({ index, children, className, fragment = false }) => {
  const { index: currIndex } = useIndex();

  if (index === undefined || currIndex !== index) {
    return null;
  }

  return fragment ? (
    <>{children}</>
  ) : (
    <SecondaryCard className={`scrollbar overflow overflow-y-auto ${className}`}>{children}</SecondaryCard>
  );
});

const Button: FC<React.ComponentProps<typeof _Button> & { index: number; togglable?: boolean }> = memo(
  ({ togglable = false, index, ...props }) => {
    const { index: currIndex, setIndex, persistIndexKey } = useIndex();
    const selected = currIndex === index;

    return (
      <_Button
        {...props}
        selected={selected}
        onClick={(e) => {
          const _index = selected && togglable ? undefined : index;
          setIndex(_index);
          if (props.onClick) props.onClick(e);
          if (persistIndexKey) persistedIndexMap.set(persistIndexKey, _index);
        }}
      />
    );
  },
);

const IconButton: FC<
  React.ComponentProps<typeof _Button> & { index: number; togglable?: boolean; icon: string; text: string }
> = memo(({ togglable = false, index, icon, text, ...props }) => {
  const { index: currIndex, setIndex, persistIndexKey } = useIndex();
  const selected = currIndex === index;

  return (
    <_Button
      {...props}
      selected={selected}
      onClick={(e) => {
        const _index = selected && togglable ? undefined : index;
        setIndex(_index);
        if (props.onClick) props.onClick(e);
        if (persistIndexKey) persistedIndexMap.set(persistIndexKey, _index);
      }}
    >
      <IconLabel imageUri={icon} text={text} hideText={!selected} className="px-2" />
    </_Button>
  );
});

const PrevButton: FC<React.ComponentProps<typeof _Button>> = memo((props) => {
  const { index, setIndex } = useIndex();

  return (
    <_Button
      {...props}
      onClick={(e) => {
        setIndex(index !== undefined ? Math.max(index - 1, 0) : 0);
        if (props.onClick) props.onClick(e);
      }}
    />
  );
});

const NextButton: FC<React.ComponentProps<typeof _Button> & { maxIndex: number }> = memo(({ maxIndex, ...props }) => {
  const { index, setIndex } = useIndex();

  return (
    <_Button
      {...props}
      onClick={(e) => {
        setIndex(index !== undefined ? Math.min(index + 1, maxIndex) : 0);
        if (props.onClick) props.onClick(e);
      }}
    />
  );
});

export const Tabs: FC<TabProps> & {
  Button: typeof Button;
  Pane: typeof Pane;
  IconButton: typeof IconButton;
  PrevButton: typeof PrevButton;
  NextButton: typeof NextButton;
} = ({ children, defaultIndex = 0, className, onChange, persistIndexKey }) => {
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    persistedIndexMap.has(persistIndexKey ?? "") ? persistedIndexMap.get(persistIndexKey ?? "") : defaultIndex,
  );

  // Ref to check if it's the first render
  const initialRender = useRef(true);

  useEffect(() => {
    // If it's the first render, skip calling onChange
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (onChange) onChange(currentIndex);
  }, [currentIndex, onChange]);

  return (
    <IndexContext.Provider value={{ index: currentIndex, setIndex: setCurrentIndex, persistIndexKey }}>
      <div className={`${className}`}>{children}</div>
    </IndexContext.Provider>
  );
};

Tabs.Button = Button;
Tabs.Pane = Pane;
Tabs.IconButton = IconButton;
Tabs.PrevButton = PrevButton;
Tabs.NextButton = NextButton;
