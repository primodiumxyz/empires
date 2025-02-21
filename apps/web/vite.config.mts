import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { comlink } from "vite-plugin-comlink";
import tsconfigPaths from "vite-tsconfig-paths";

import postcss from "./postcss.config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      parseNative: false,
    }),
    react(),
    comlink(),
  ],
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  worker: {
    plugins: () => [comlink()],
  },
  build: {
    rollupOptions: {
      external: [/^contracts:.*/],
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          // mud: ["@latticexyz/common", "@latticexyz/world"],
          // core: ["@primodiumxyz/core"],
          // phaser: ["phaser"],
        },
      },
    },
    target: "ES2022",
  },
  envPrefix: "PRI_",
  envDir: "../../",
  css: {
    postcss,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "../../packages/core/src"),
      "@game": path.resolve(__dirname, "../../packages/game/src"),
      "@assets": path.resolve(__dirname, "../../packages/assets/src"),
      "@engine": path.resolve(__dirname, "../../packages/engine/src"),
    },
  },
});
