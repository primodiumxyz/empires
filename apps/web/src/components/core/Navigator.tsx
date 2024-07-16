import { FC, ReactNode, createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";

interface NavigationContextValue {
  navigateTo: (screenTitle: string, replace?: boolean) => void;
  goBack: () => void;
  history: string[];
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const Navigator: FC<{
  initialScreen?: string;
  children?: ReactNode;
  className?: string;
}> & {
  Screen: typeof Screen;
  NavButton: typeof NavButton;
  BackButton: typeof BackButton;
  Breadcrumbs: typeof Breadcrumbs;
} = ({ children, initialScreen = "Home", className }) => {
  const [history, setHistory] = useState<string[]>([initialScreen]);

  // Reset history when initialScreen prop changes
  useLayoutEffect(() => {
    setHistory([initialScreen]);
  }, [initialScreen]);

  const navigateTo = useCallback(
    (screenTitle: string, replace = false) => {
      if (replace) {
        const index = history.indexOf(screenTitle);
        if (index !== -1) {
          setHistory((prev) => prev.slice(0, index + 1));
        } else {
          setHistory((prev) => [...prev, screenTitle]); // fallback
        }
      } else {
        setHistory((prev) => [...prev, screenTitle]);
      }
    },
    [history]
  );

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length > 1) return prev.slice(0, -1);
      return prev;
    });
  }, []);

  return (
    <NavigationContext.Provider value={{ navigateTo, goBack, history }}>
      <div className={className}>{children}</div>
    </NavigationContext.Provider>
  );
};

const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("Navigation components must be used within Navigator");
  }
  return context;
};

const Screen: FC<{
  title: string;
  className?: string;
  children?: ReactNode;
}> = ({ title, className, children }) => {
  const { history } = useNavigation();
  if (history[history.length - 1] !== title) return null;
  return <div className={`flex flex-col w-full ${className} animate-in fade-in duration-300`}>{children}</div>;
};

const NavButton: FC<
  React.ComponentProps<typeof Button> & {
    to: string;
    children?: ReactNode;
    className?: string;
    disabled?: boolean;
    tooltip?: string;
    tooltipDirection?: "top" | "bottom" | "right" | "left";
    onClick?: () => void;
  }
> = ({ to, className, children, disabled, onClick, tooltip, tooltipDirection = "top", ...props }) => {
  const { navigateTo, history } = useNavigation();

  return (
    <Button
      tooltip={tooltip}
      tooltipDirection={tooltipDirection}
      className={className}
      onClick={() => {
        if (onClick) onClick();
        navigateTo(to, true);
      }}
      disabled={disabled || to === history[history.length - 1]}
      {...props}
    >
      {children}
    </Button>
  );
};

const BackButton: FC<{
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, onClick, className, disabled = false }) => {
  const { goBack, history } = useNavigation();
  if (history.length <= 1) return <></>;

  return (
    <Button
      disabled={history.length <= 1 || disabled}
      onClick={() => {
        if (onClick) onClick();
        goBack();
      }}
      className={`${className} btn-sm border-secondary`}
    >
      {children || "Back"}
    </Button>
  );
};

const Breadcrumbs: FC<{ children?: ReactNode }> = () => {
  const { history, navigateTo } = useNavigation();
  return (
    <SecondaryCard className="w-fit text-xs breadcrumbs pointer-events-auto">
      <ul>
        {history.map((item, index) => (
          <li key={index}>
            <button onClick={() => navigateTo(item, true)}>{item}</button>
          </li>
        ))}
      </ul>
    </SecondaryCard>
  );
};

Navigator.Screen = Screen;
Navigator.NavButton = NavButton;
Navigator.BackButton = BackButton;
Navigator.Breadcrumbs = Breadcrumbs;
