export const Checkbox: React.FC<{
  label?: string;
  defaultChecked?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
}> = ({ label, defaultChecked = false, className, onChange }) => {
  return (
    <div className="form-control">
      <label className="label cursor-pointer gap-2">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          onChange={(e) => {
            const checked = e.target.checked;

            if (onChange) onChange(checked);
          }}
          className={`${className} checkbox`}
        />
        {label && <span className="label-text">{label}</span>}
      </label>
    </div>
  );
};
