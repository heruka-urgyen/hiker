module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    "plugin:react/recommended",
    "airbnb",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: "module",
  },
  plugins: [
    "react",
  ],
  rules: {
    semi: 0,
    "no-shadow": 0,
    "arrow-parens": 0,
    "object-curly-spacing": 0,
    "object-curly-newline": 0,
    "no-confusing-arrow": 0,
    "react/jsx-filename-extension": 0,
    "operator-linebreak": ["error", "after"],
    "import/no-extraneous-dependencies": ["error", {devDependencies: true}],
    "no-unused-vars": ["error", {
      vars: "all",
      args: "after-used",
      ignoreRestSiblings: false,
      varsIgnorePattern: "_",
      argsIgnorePattern: "_",
    }],
    quotes: ["error", "double"],
  },
};
