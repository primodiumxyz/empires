import { useEffect } from "react";

import { BackgroundNebula } from "@/components/BackgroundNebula";

export default function App() {
  useEffect(() => {
    setTimeout(() => {
      window.location.href =
        "https://primodium.notion.site/Primodium-Empires-Guide-17a33ade92d38031b15be6e28a4b595a?pvs=74";
    }, 10);
  }, []);

  return (
    <>
      <BackgroundNebula />
    </>
  );
}
