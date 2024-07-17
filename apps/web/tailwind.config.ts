/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import tailwindAnimate from "tailwindcss-animate";
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Space Mono", ...defaultTheme.fontFamily.mono],
        pixel: ["Silkscreen", ...defaultTheme.fontFamily.mono],
      },
      cursor: {
        default: 'url("/img/cursors/normal.png"), auto',
        pointer: 'url("/img/cursors/pointer.png") 12 0, auto',
        pointerDown: 'url("/img/cursors/pointerdown.png") 12 0, auto',
      },
    },
  },
  daisyui: {
    themes: [
      {
        base: {
          primary: colors.cyan[900],
          secondary: colors.cyan[700],
          accent: colors.cyan[400],
          neutral: colors.slate[900],
          "base-100": colors.slate[800],
          info: colors.indigo[800],
          success: colors.emerald[600],
          warning: colors.yellow[600],
          error: "#A8375D",

          "--rounded-box": ".5rem", // border radius rounded-box utility class, used in card and other large boxes
          "--rounded-btn": ".5rem", // border radius rounded-btn utility class, used in buttons and similar element
          "--rounded-badge": ".25rem", // border radius rounded-badge utility class, used in badges and similar
          "--animation-btn": "0s", // duration of animation when you click on button
          "--animation-input": "0.2s", // duration of animation for inputs like checkbox, toggle, radio, etc
          "--btn-text-case": "uppercase", // set default text transform for buttons
          "--btn-focus-scale": "1", // scale transform of button when you focus on it
          "--border-btn": "1px", // border width of buttons
          "--tab-border": "1px", // border width of tabs
          "--tab-radius": "0.5rem", // border radius of tabs
        },
      },
    ],
    darkTheme: "base",
  },
  plugins: [daisyui, tailwindAnimate],
};
