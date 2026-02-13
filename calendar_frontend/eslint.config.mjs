import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser globals
        document: true,
        window: true,
        fetch: true,
        URL: true,
        URLSearchParams: true,

        // CRA injects process.env at build time; mark as global for linting.
        process: true,

        // Test globals (CRA/Jest)
        test: true,
        expect: true,
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "React|App" }],
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: { react: pluginReact, "react-hooks": pluginReactHooks },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",

      // Enable recommended hooks rules; fixes "Definition for rule ... was not found"
      // by ensuring the plugin is registered.
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
];
