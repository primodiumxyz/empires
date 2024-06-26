import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";
import tailwindConfig from "./tailwind.config";

// Define the type for the configuration explicitly
type PostCSSConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: any;
};

const config: PostCSSConfig = {
  plugins: [tailwind(tailwindConfig), autoprefixer],
};

export default config;
