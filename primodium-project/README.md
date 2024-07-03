# React Client ![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=template-react-client)

This template provides a minimal setup to start working on a client for Primodium (via the Primodium Core package).

Technologies used: `primodiumxyz/core`, `primodiumxyz/reactive-tables`, `shadcn/ui`, `react+vite`

## Getting started

```bash
npm create primodium@latest --template react-client
cd primodium-project #your project name
npm install
npm run dev
```

## Development

The Core package exposes a set of tools and utilities you can use to interact with Primodium easily.
For more details visit the [Primodium Core repository](https://www.npmjs.com/package/@primodiumxyz/core).

Use this repository as a template for creating your own bots and dashboards.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
