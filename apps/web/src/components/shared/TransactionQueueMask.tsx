import { Loader } from "@/components/shared/Loader";
import { useCore } from "@primodiumxyz/core/react";

export const TransactionQueueMask: React.FC<{
  children: React.ReactNode;
  id: string;
  className?: string;
  size?: "sm" | "xs";
}> = ({ children, id, className, size = "sm" }) => {
  const { tables } = useCore();
  const queuePosition = tables.TransactionQueue.useIndex(id);

  if (queuePosition === -1) return <div className={className}>{children}</div>;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-black/75 rounded-box">
        {queuePosition !== 0 && (
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-black rounded-full px-2 border border-secondary text-xs">
            {queuePosition}
          </div>
        )}
        {queuePosition === 0 && (
          <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2">
            <Loader className="w-full h-full" size={size == "sm" ? "loading-sm" : "loading-xs"} />
          </div>
        )}
      </div>
    </div>
  );
};
