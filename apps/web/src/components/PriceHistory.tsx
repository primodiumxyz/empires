import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { useEthPrice } from "@/hooks/useEthPrice";
import { Card } from "@/components/core/Card";
import { Badge } from "@/components/core/Badge";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";
import { usePointPrice } from "@/hooks/usePointPrice";
import { HistoricalPointPriceModal } from "@/components/HistoricalPointPriceModal";

export const EmpireEnumToColor: Record<EEmpire, string> = {
    [EEmpire.Blue]: "bg-blue-600",
    [EEmpire.Green]: "bg-green-600",
    [EEmpire.Red]: "bg-red-600",
    [EEmpire.LENGTH]: "",
};


export const PriceHistory = () => {
    return (
        <Card noDecor>
            <div className="flex flex-col justify-center gap-1 text-center">
                <p className="text-left text-xs font-bold uppercase mb-1">Price History</p>
                <div className="grid grid-cols-2 text-xs">
                    <p className="col-span-1">Empire</p>
                    <p className="col-span-1">Price</p>
                </div>
                <EmpireDetails empire={EEmpire.Red} />
                <EmpireDetails empire={EEmpire.Green} />
                <EmpireDetails empire={EEmpire.Blue} />

            </div>
            <p className="text-xs text-right pt-2"> <HistoricalPointPriceModal showIcon={false} /></p>

        </Card>
    );

};

const EmpireDetails = ({ empire }: { empire: EEmpire }) => {
    const { tables, utils: { weiToUsd }, } = useCore();
    const { price: ethPrice } = useEthPrice();
    const { price: sellPrice } = usePointPrice(empire, 1);
    const sellPriceUsd = weiToUsd(sellPrice, ethPrice ?? 0);
    const points = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;

    return (<>
        <div className="flex flex-col justify-center rounded border border-gray-600 p-2 text-center text-white">
            <Badge className="flex h-6 w-full items-center justify-start gap-2 border-none">
                <div className="flex gap-2">
                    <div className={cn("h-4 w-4 rounded-full", EmpireEnumToColor[empire])} />
                </div>

                {/* Price, Empire Points*/}
                <div className="grid grid-cols-2 gap-2 w-32">
                    <p>{formatEther(points)}Pts</p>
                    <p>{sellPriceUsd}</p>
                </div>

            </Badge>
        </div >
    </>
    );
};


