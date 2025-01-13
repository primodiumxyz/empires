import { useEffect } from "react";

import { BackgroundNebula } from "@/components/BackgroundNebula";

export default function App() {
  useEffect(() => {
    setTimeout(() => {
      window.location.href =
        "https://www.notion.so/primodium/Primodium-Empires-Game-Features-17a33ade92d380178822f6f49e333966";
    }, 10);
  }, []);

  return (
    <>
      <BackgroundNebula />
    </>
  );
}
