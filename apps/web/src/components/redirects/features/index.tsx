import { useEffect } from "react";

import { BackgroundNebula } from "@/components/BackgroundNebula";

export default function App() {
  useEffect(() => {
    setTimeout(() => {
      window.location.href =
        "https://primodium.notion.site/Primodium-Empires-Game-Features-17a33ade92d380178822f6f49e333966?pvs=74";
    }, 10);
  }, []);

  return (
    <>
      <BackgroundNebula />
    </>
  );
}
