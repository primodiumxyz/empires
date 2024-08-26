export const IconLabel: React.FC<{
  imageUri: string;
  text?: string;
  hideText?: boolean;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ imageUri, text, className, hideText, caption, style }) => {
  return (
    <span className={`${className} inline-flex items-center`} style={style}>
      <img src={imageUri} alt={text} className={`pixel-images w-[1.25em] scale-150`} draggable="false" />
      {text && !hideText && (
        <div className="flex w-fit flex-col px-2 text-start">
          <span className="">{text}</span>
          {caption && <span className="text-xs text-gray-400">{caption}</span>}
        </div>
      )}
    </span>
  );
};
