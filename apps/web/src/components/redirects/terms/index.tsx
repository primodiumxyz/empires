import { useEffect } from "react";

import { BackgroundNebula } from "@/components/BackgroundNebula";

export default function App() {
  useEffect(() => {
    setTimeout(() => {
      window.location.href =
        "https://primodium.notion.site/Primodium-Empires-Terms-of-Service-17d33ade92d380e596d1c74ab886ce06";
    }, 10);
  }, []);

  return (
    <>
      <BackgroundNebula />
    </>
  );
}
