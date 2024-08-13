import { useState, useEffect } from "react";

const getIsPortrait = (): boolean => window.innerHeight > window.innerWidth;
const getIsLandscape = (): boolean => window.innerWidth > window.innerHeight;

export const useOrientation = (): {
  isPortrait: boolean;
  isLandscape: boolean;
} => {
  const [isPortrait, setIsPortrait] = useState(getIsPortrait());
  const [isLandscape, setIsLandscape] = useState(getIsLandscape());

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(getIsPortrait());
      setIsLandscape(getIsLandscape());
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isPortrait, isLandscape };
};
