module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['android/', 'coverage/'],
  rules: {
    // Formatting drift is fixable with `npm run format`; it should not fail a build.
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: ['__tests__/**/*.ts', '__tests__/**/*.tsx'],
      env: {jest: true},
    },
  ],
};
