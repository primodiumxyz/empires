import { useNavigate } from "react-router-dom";

import { Button } from "@/components/core/Button";

export function GuideButton() {
  const navigate = useNavigate();

  return (
    <Button size="sm" variant="accent" onClick={() => navigate("features")}>
      Game Guide
    </Button>
  );
}
