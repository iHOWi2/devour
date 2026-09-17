/**
 * react-native-safe-area-context talks to a native view, which a test renderer does not
 * have. The library ships the mock; using it keeps the inset values at zero so layout
 * assertions stay about the layout.
 */
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
