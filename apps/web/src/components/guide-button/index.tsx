import { useNavigate } from "react-router-dom";

import { Button } from "@/components/core/Button";

export function GuideButton() {
  const navigate = useNavigate();

  return (
    <Button size="md" variant="accent" onClick={() => navigate("guide")}>
      Game Guide
    </Button>
  );
}
