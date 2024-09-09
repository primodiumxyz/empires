import { defineConfig } from 'tsup';

export default defineConfig({
  tsconfig: 'tsconfig.build.json',
  entry: ['src/index.ts', 'bin/keeper-server.ts'],
  target: 'esnext',
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: true,
});
