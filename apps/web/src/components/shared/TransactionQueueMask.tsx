import { useCore } from "@primodiumxyz/core/react";
import { Loader } from "@/components/shared/Loader";

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
      <div className="absolute inset-0 rounded-box bg-black/75">
        {queuePosition !== 0 && (
          <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 rounded-full border border-secondary bg-black px-2 text-xs">
            {queuePosition}
          </div>
        )}
        {queuePosition === 0 && (
          <div className="absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2">
            <Loader className="h-full w-full" size={size} />
          </div>
        )}
      </div>
    </div>
  );
};
