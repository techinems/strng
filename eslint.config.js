const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-console": "off",
      "no-var": "warn",
      "no-case-declarations": "off",
      "semi-spacing": ["error", { before: false, after: true }],
      "max-len": ["error", { code: 90 }],
      indent: ["error", 2],
      "no-lonely-if": "error",
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "require-await": "error",
      "prefer-arrow-callback": "error",
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
