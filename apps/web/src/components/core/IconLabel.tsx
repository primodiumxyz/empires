import { cn } from "@/util/client";

export const IconLabel: React.FC<{
  imageUri: string;
  text?: string;
  hideText?: boolean;
  caption?: string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}> = ({ imageUri, text, className, imgClassName, hideText, caption, style }) => {
  return (
    <span className={cn(className, "inline-flex items-center")} style={style}>
      <img
        src={imageUri}
        alt={text}
        className={cn("pixel-images w-[1.25em] scale-150", imgClassName)}
        draggable="false"
      />
      {text && !hideText && (
        <div className="flex w-fit flex-col px-2 text-start">
          <span className="">{text}</span>
          {caption && <span className="text-xs text-gray-400">{caption}</span>}
        </div>
      )}
    </span>
  );
};
