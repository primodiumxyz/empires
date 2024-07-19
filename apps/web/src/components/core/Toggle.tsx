export const Toggle: React.FC<{
  className?: string;
  defaultChecked?: boolean;
  onToggle?: () => void;
}> = ({ className, defaultChecked = false, onToggle }) => {
  return (
    <div className="form-control pointer-events-auto h-fit w-fit p-2 transition-all hover:bg-secondary/25">
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
