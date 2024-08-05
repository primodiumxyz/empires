import { Tabs } from "@/components/core/Tabs";

export const MagnetButton = () => {
  return (
    <Tabs.Button size="content" index={0}>
      <svg width="105" height="125" viewBox="0 0 105 125" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M51.6343 4L9.16797 28.5179C7.31156 29.5897 6.16797 31.5705 6.16797 33.7141V82.75M97.1007 30.25V79.2859C97.1007 81.4295 95.9571 83.4103 94.1007 84.4821L51.6343 109"
          stroke="#6EEDFF"
        />
        <path d="M51.6343 4L97.1007 30.25M51.6343 109L6.16797 82.75" stroke="#6EEDFF" stroke-dasharray="2 2" />
        <path
          d="M48.6667 11.5641C50.5231 10.4923 52.8103 10.4923 54.6667 11.5641L89.0812 31.4333C90.9376 32.5051 92.0812 34.4859 92.0812 36.6295V76.3679C92.0812 78.5115 90.9376 80.4923 89.0812 81.5641L54.6667 101.433C52.8103 102.505 50.5231 102.505 48.6667 101.433L14.2522 81.5641C12.3957 80.4923 11.2521 78.5115 11.2521 76.3679V36.6295C11.2521 34.4859 12.3957 32.5051 14.2521 31.4333L48.6667 11.5641Z"
          fill="#2C4148"
        />
        <path
          d="M54.4167 11.9971L88.8312 31.8663C90.5329 32.8488 91.5812 34.6645 91.5812 36.6295V76.3679C91.5812 78.3329 90.5329 80.1486 88.8312 81.1311L54.4167 101C52.715 101.983 50.6184 101.983 48.9167 101L14.5022 81.1311C12.8004 80.1486 11.7521 78.3329 11.7521 76.3679V36.6295C11.7521 34.6645 12.8004 32.8488 14.5021 31.8663L48.9167 11.9971C50.6184 11.0146 52.715 11.0146 54.4167 11.9971Z"
          stroke="#6EEDFF"
          stroke-opacity="0.8"
        />
        <g filter="url(#filter0_f_1116_10120)">
          <path
            d="M55.25 6.16506L94.7163 28.951C96.418 29.9334 97.4663 31.7491 97.4663 33.7141V79.2859C97.4663 81.2509 96.418 83.0666 94.7163 84.049L55.25 106.835C53.5483 107.817 51.4517 107.817 49.75 106.835L10.2837 84.049C8.58196 83.0666 7.53366 81.2509 7.53366 79.2859V33.7141C7.53366 31.7491 8.58196 29.9334 10.2837 28.951L49.75 6.16506C51.4517 5.18258 53.5483 5.18258 55.25 6.16506Z"
            stroke="#6EEDFF"
          />
        </g>
        <path d="M54 101L54 125" stroke="url(#paint0_linear_1116_10120)" stroke-width="2" />
        <path d="M50 101L50 125" stroke="url(#paint1_linear_1116_10120)" stroke-width="2" />
        <defs>
          <filter
            id="filter0_f_1116_10120"
            x="3.03516"
            y="0.927734"
            width="98.9297"
            height="111.145"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="2" result="effect1_foregroundBlur_1116_10120" />
          </filter>
          <linearGradient
            id="paint0_linear_1116_10120"
            x1="54.5"
            y1="101"
            x2="54.5"
            y2="125"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#5EC3D2" />
            <stop offset="0.0922414" stop-color="#6EEDFF" />
            <stop offset="1" stop-color="#428E99" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_1116_10120"
            x1="50.5"
            y1="101"
            x2="50.5"
            y2="125"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#5EC3D2" />
            <stop offset="0.0922414" stop-color="#6EEDFF" />
            <stop offset="1" stop-color="#428E99" />
          </linearGradient>
        </defs>
      </svg>
    </Tabs.Button>
  );
};
