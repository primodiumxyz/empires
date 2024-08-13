export const IconLabel: React.FC<{
  imageUri: string;
  text?: string;
  hideText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ imageUri, text, className, hideText, style }) => {
  return (
    <span className={`${className} inline-flex items-center`} style={style}>
      <img src={imageUri} alt={text} className={`pixel-images w-[1em] scale-150`} draggable="false" />
      {text && !hideText && <span className="w-fit px-2">{text}</span>}
    </span>
  );
};
