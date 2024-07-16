export const Toggle: React.FC<{
  className?: string;
  defaultChecked?: boolean;
  onToggle?: () => void;
}> = ({ className, defaultChecked = false, onToggle }) => {
  return (
    <div className="form-control w-fit h-fit pointer-events-auto p-2 hover:bg-secondary/25 transition-all">
      <input
        type="checkbox"
        className={`toggle ${className}`}
        defaultChecked={defaultChecked}
        onClick={() => {
          onToggle?.();
        }}
      />
    </div>
  );
};
