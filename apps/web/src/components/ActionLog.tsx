import { AutoSizer } from "@/components/core/AutoSizer";
import { SecondaryCard } from "@/components/core/Card";
import { useActions } from "@/hooks/useActions";

export const ActionLog = () => {
  const actions = useActions();

  return (
    <SecondaryCard className="hide-scrollbar pointer-events-auto hidden h-[200px] w-full flex-grow overflow-y-auto rounded-box p-4 lg:block">
      <AutoSizer items={actions} itemSize={40} render={(action) => action.element} scrollToBottom />
    </SecondaryCard>
  );
};
