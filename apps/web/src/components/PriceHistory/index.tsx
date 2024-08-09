import { EmpireDetails } from "@/components/PriceHistory/EmpireDetails";
import { HistoricalPointPriceModal } from "@/components/PriceHistory/HistoricalPointPriceModal";

export const PriceHistory = () => {
  return (
    <div className="flex flex-col items-center">
      <EmpireDetails />

      <hr className="mt-2 w-full border-secondary/50" />
      <HistoricalPointPriceModal />
    </div>
  );
};
