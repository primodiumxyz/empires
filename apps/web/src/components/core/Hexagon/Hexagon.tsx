import { cn } from "@/util/client";

export const Hexagon: React.FC<{
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}> = ({ size = 100, fill = "#fff", style, className, children }) => {
  return (
    <div style={style} className={cn(className)}>
      <div className="relative">
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width={size * 2}
          height={size * 2}
          style={style}
          viewBox="0 0 173.20508075688772 200"
        >
          <path
            fill={fill}
            d="M69.28203230275508 9.999999999999998Q86.60254037844386 0 103.92304845413264 9.999999999999998L155.88457268119896 40Q173.20508075688772 50 173.20508075688772 70L173.20508075688772 130Q173.20508075688772 150 155.88457268119896 160L103.92304845413264 190Q86.60254037844386 200 69.28203230275508 190L17.320508075688775 160Q0 150 0 130L0 70Q0 50 17.320508075688775 40Z"
          ></path>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
};
