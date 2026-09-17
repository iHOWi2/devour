import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AgentProvider} from './agent';
import {ThemeProvider} from './design/ThemeProvider';
import {LanguageProvider} from './i18n';
import {RootScreen} from './screens/RootScreen';

/**
 * Composition root: the safe area, the language, the theme and the agent runtime are
 * decided here, once, and everything below reads them from context. Screens stay unaware
 * of where any of it came from - which is what lets the model provider be swapped without
 * touching a screen.
 */
export function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AgentProvider>
            <RootScreen />
          </AgentProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
