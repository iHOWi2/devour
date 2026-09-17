import React from 'react';

import {ThemeProvider} from './design/ThemeProvider';
import {LanguageProvider} from './i18n';
import {FoundationScreen} from './screens/FoundationScreen';

/**
 * Composition root: the language and the theme are decided here, once, and everything
 * below reads them from context. Screens stay unaware of where either choice came from.
 */
export function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <FoundationScreen />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
