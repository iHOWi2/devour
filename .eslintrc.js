module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['android/', 'coverage/'],
  // Prettier is a formatter here, not an ESLint rule: @react-native/eslint-config 0.87 does
  // not ship eslint-plugin-prettier, so referencing `prettier/prettier` fails the lint run.
  // Formatting is applied with `npm run format` and checked with `npm run format:check`.
  overrides: [
    {
      files: ['__tests__/**/*.ts', '__tests__/**/*.tsx', 'jest.setup.js'],
      env: {jest: true},
    },
  ],
};
