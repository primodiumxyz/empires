import { AutoSizer } from "@/components/core/AutoSizer";
import { useActions } from "@/hooks/useActions";

type ActionLogEntry = {
  actor: string;
  type: string;
  timestamp: bigint;
  details: string;
};

export const ActionLog = () => {
  const actions = useActions();

  return (
    <div className="pointer-events-auto h-[200px] w-[300px] flex-grow overflow-y-auto bg-white/10 p-4">
      <AutoSizer items={actions} itemSize={40} render={(action) => action.element} scrollToBottom />
    </div>
  );
};
