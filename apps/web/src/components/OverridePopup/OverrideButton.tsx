import { InterfaceIcons } from "@primodiumxyz/assets";
import { AxialCoord, convertAxialToCartesian } from "@primodiumxyz/core";
import { IconLabel } from "@/components/core/IconLabel";
import { Tabs, useTabs } from "@/components/core/Tabs";
import { cn } from "@/util/client";

export const OverrideButton: React.FC<{
  index: number;
  icon: keyof typeof InterfaceIcons;
  stroke?: string;
  fill?: string;
  axialCoord: AxialCoord;
}> = ({ index, icon, stroke = "#6EEDFF", fill = "#2C4148", axialCoord }) => {
  const currentIndex = useTabs();
  const coord = convertAxialToCartesian(axialCoord, 45);
  return (
    <div
      className={cn(`absolute -translate-x-1/2 -translate-y-1/2`)}
      style={{ left: `${coord.x}px`, top: `${coord.y}px` }}
    >
      <Tabs.Button fragment index={index} className={cn(currentIndex === index && "scale-110")}>
        <div className="relative">
          <svg width="78" height="86" viewBox="0 0 78 86" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M38.6422 4L7.86719 21.7679C6.01078 22.8397 4.86719 24.8205 4.86719 26.9641V62.5M72.4172 23.5V59.0359C72.4172 61.1795 71.2736 63.1603 69.4172 64.2321L38.6422 82"
              stroke={stroke}
            />
            <path d="M38.6422 4L72.4172 23.5M38.6422 82L4.86719 62.5" stroke={stroke} strokeDasharray="2 2" />
            <path
              d="M35.6667 9.73205C37.5231 8.66026 39.8103 8.66025 41.6667 9.73205L65.6889 23.6013C67.5453 24.6731 68.6889 26.6538 68.6889 28.7974V56.5359C68.6889 58.6795 67.5453 60.6603 65.6889 61.732L41.6667 75.6013C39.8103 76.6731 37.5231 76.6731 35.6667 75.6013L11.6445 61.732C9.78805 60.6603 8.64445 58.6795 8.64445 56.5359V28.7974C8.64445 26.6538 9.78805 24.6731 11.6445 23.6013L35.6667 9.73205Z"
              fill={currentIndex === index ? fill : "none"}
            />
            <path
              d="M41.4167 10.1651L65.4389 24.0343C67.1406 25.0168 68.1889 26.8325 68.1889 28.7974V56.5359C68.1889 58.5009 67.1406 60.3166 65.4389 61.299L41.4167 75.1683C39.715 76.1507 37.6184 76.1507 35.9167 75.1683L11.8945 61.299C10.1927 60.3166 9.14445 58.5009 9.14445 56.5359V28.7974C9.14445 26.8325 10.1927 25.0168 11.8945 24.0343L35.9167 10.1651C37.6184 9.18258 39.715 9.18258 41.4167 10.1651Z"
              stroke={stroke}
              strokeOpacity="0.8"
            />
            <g filter="url(#filter0_f_1117_17019)">
              <path
                d="M41.75 6.16506L69.525 22.201C71.2267 23.1834 72.275 24.9991 72.275 26.9641V59.0359C72.275 61.0009 71.2267 62.8166 69.525 63.799L41.75 79.8349C40.0483 80.8174 37.9517 80.8174 36.25 79.8349L8.47501 63.799C6.7733 62.8166 5.72501 61.0009 5.72501 59.0359V26.9641C5.72501 24.9991 6.7733 23.1834 8.47501 22.201L36.25 6.16506C37.9517 5.18258 40.0483 5.18258 41.75 6.16506Z"
                stroke={stroke}
              />
            </g>
            <defs>
              <filter
                id="filter0_f_1117_17019"
                x="1.22656"
                y="0.927734"
                width="75.5469"
                height="84.1445"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_1117_17019" />
              </filter>
            </defs>
          </svg>
          <IconLabel
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            imageUri={InterfaceIcons[icon]}
            hideText
          />
        </div>
      </Tabs.Button>
    </div>
  );
};
