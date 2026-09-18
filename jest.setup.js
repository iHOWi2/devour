/**
 * react-native-safe-area-context talks to a native view, which a test renderer does not
 * have. The library ships the mock; using it keeps the inset values at zero so layout
 * assertions stay about the layout.
 */
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

/**
 * Devour animates with the native driver, which attaches to a real host view. A test
 * renderer has no host views, so the driver would reach for a native tag that does not
 * exist and take the suite down with it - and a JavaScript-driven animation would instead
 * leave timers ticking after the test that started them.
 *
 * React Native ships the answer for both: with animations disabled, `Animated` swaps in an
 * implementation that runs every animation straight to its final value. The components
 * under test therefore mount, animate and settle in one frame, and the application code
 * keeps no test-only branches.
 */
Object.defineProperty(require('react-native').Platform, 'isDisableAnimations', {
  configurable: true,
  get: () => true,
});
