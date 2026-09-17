# Project map

Every file in the repository, what it is for, and where to put new work. If you are looking
for a file, start here instead of grepping. If you add a file, add a line here in the same
commit - a map that lags behind the code is worse than no map.

Companion documents: [ARCHITECTURE.md](ARCHITECTURE.md) for layer contracts,
[DESIGN.md](DESIGN.md) for the visual language, [ROADMAP.md](ROADMAP.md) for phase order,
[SKILL-SYSTEM.md](SKILL-SYSTEM.md) for the skill format, [RESEARCH.md](RESEARCH.md) for
findings, and `AUDIT.txt` in the repository root for the handoff briefing.

## Tree

```
devour/
|-- AUDIT.txt                       handoff briefing: project, user intent, rules, landmines
|-- README.md                       what Devour is, current status, setup, roadmap summary
|-- CONTRIBUTING.md                 the per-iteration gate and commit conventions
|-- LICENSE                         MIT
|-- index.js                        React Native entry point: registers App under 'devour'
|-- app.json                        app name for the CLI and the registered component
|-- package.json                    dependencies, npm scripts, engines
|-- tsconfig.json                   extends @react-native/typescript-config, strict
|-- babel.config.js                 @react-native/babel-preset
|-- metro.config.js                 default Metro config
|-- jest.config.js                  preset: @react-native/jest-preset
|-- .eslintrc.js                    @react-native/eslint-config (no prettier plugin, see AUDIT)
|-- .prettierrc.js                  formatting rules for `npm run format`
|-- .nvmrc / .watchmanconfig        Node version pin, Watchman config
|-- .gitignore                      node_modules, build outputs, local keystores
|
|-- .github/
|   |-- pull_request_template.md    checklist mirroring the iteration gate
|   |-- ISSUE_TEMPLATE/
|   |   |-- bug_report.yml
|   |   `-- feature_request.yml
|   `-- workflows/
|       |-- ci.yml                  js job (lint, typecheck, tests) + android job (APK)
|       `-- release.yml             tag v* -> signed release APK (unverified, no tag yet)
|
|-- docs/
|   |-- MAP.md                      this file
|   |-- ARCHITECTURE.md             layers, boundaries, import rules, decisions log
|   |-- DESIGN.md                   direction, palettes, type, spacing, motion, quality floor
|   |-- SKILL-SYSTEM.md             Devour skill format, scopes, discovery, loading
|   |-- ROADMAP.md                  phases 0-11, exit criteria, defects found, deferred work
|   `-- RESEARCH.md                 Phase 0 findings and version research
|
|-- scripts/
|   `-- bootstrap-gradle-wrapper.sh generates the Gradle wrapper (JARs are not committed)
|
|-- src/
|   |-- App.tsx                     composition root: ThemeProvider + LanguageProvider only
|   |-- design/
|   |   |-- tokens.ts               space, radius, typography, motion, TOUCH_TARGET (no colour)
|   |   |-- theme.ts                dark and light palettes, DeviceColorScheme, resolveTheme
|   |   `-- ThemeProvider.tsx       theme context, follows the device unless overridden
|   |-- i18n/
|   |   |-- index.ts                public surface: useI18n, types, re-exports
|   |   |-- language.ts             Language / LanguagePreference, resolveLanguage(locale)
|   |   |-- messages.ts             the dictionaries: MESSAGE_KEYS, en, ru, plural forms
|   |   |-- plural.ts               CLDR plural category selection (ru: one/few/many)
|   |   |-- translate.ts            t() and plural(): lookup plus {placeholder} interpolation
|   |   |-- device.ts               reads the device locale from I18nManager constants
|   |   `-- LanguageProvider.tsx    language context, follows the device unless overridden
|   |-- lib/
|   |   `-- format.ts               pure formatters: formatBytes, formatDeviceName
|   |-- native/
|   |   |-- environment.ts          typed wrapper over the DevourEnvironment native module
|   |   `-- index.ts                public surface of the native layer
|   |-- screens/
|   |   `-- FoundationScreen.tsx    Phase 1 screen: device facts, failure + retry, footer
|   `-- ui/
|       |-- DataRow.tsx             label + value row with an optional state dot
|       |-- PhaseMark.tsx           the large phase number and its name
|       |-- SegmentedControl.tsx    generic segmented choice, 44 px targets
|       `-- SettingsPanel.tsx       theme and language controls, revealed from the footer
|
|-- __tests__/
|   |-- tokens.test.ts              tokens carry no colour; scales stay ordered
|   |-- theme.test.ts               palette parity, device scheme fallbacks, status bar
|   |-- i18n.test.ts                dictionary completeness, locale parsing, plural forms
|   |-- format.test.ts              formatBytes and formatDeviceName edge cases
|   |-- environment.test.ts         native wrapper: shape validation and error mapping
|   `-- App.test.tsx                the screen renders, switches theme/language, retries
|
`-- android/
    |-- build.gradle                root config: SDK, NDK, Kotlin versions
    |-- settings.gradle             RN autolinking and included builds
    |-- gradle.properties           new architecture, Hermes, architectures, JVM args
    |-- gradle/wrapper/gradle-wrapper.properties  Gradle 9.4.1 distribution
    `-- app/
        |-- build.gradle            react { debuggableVariants = [] }, signing, ProGuard
        |-- proguard-rules.pro      release shrinker rules
        `-- src/main/
            |-- AndroidManifest.xml activity, <queries> for the Termux package
            |-- java/com/devour/app/
            |   |-- MainApplication.kt      ReactApplication, package list, new architecture
            |   |-- MainActivity.kt         ReactActivity, component name 'devour'
            |   `-- nativemodules/
            |       |-- DevourEnvironmentModule.kt  device, storage and runtime-host facts
            |       `-- DevourNativePackage.kt      registers the module (getModule provider)
            `-- res/
                |-- values/{strings,colors,styles}.xml
                |-- drawable/{rn_edit_text_material,ic_launcher_background,ic_launcher_foreground}.xml
                `-- mipmap*/ic_launcher.xml
```

## Where do I put this?

| I want to ... | Touch |
| --- | --- |
| add or change UI copy | `src/i18n/messages.ts` (both `en` and `ru`; a missing key fails typecheck) |
| add a plural phrase | `PLURAL_KEYS` + both dictionaries in `src/i18n/messages.ts` |
| add a language | `src/i18n/language.ts`, `messages.ts`, `plural.ts`, then the language control |
| change a colour | `src/design/theme.ts` - both palettes. Never a hex in a component |
| change spacing, type or motion | `src/design/tokens.ts` |
| build a reusable control | `src/ui/`, styled from `useTheme()` and tokens |
| build a screen | `src/screens/`, composed from `src/ui/` |
| add a pure helper | `src/lib/`, with a test next to it in `__tests__/` |
| expose a new device or OS fact | Kotlin module in `android/.../nativemodules/`, then a typed wrapper in `src/native/` |
| add an npm dependency | `package.json`; note in `AUDIT.txt` that no lockfile is committed yet |
| change the Android build | `android/app/build.gradle`, and re-read decision 8 in ARCHITECTURE.md first |
| change what CI checks | `.github/workflows/ci.yml`; a check that cannot fail is not a check |
| record a decision | `docs/ARCHITECTURE.md` decisions log |
| record a defect CI caught | `docs/ROADMAP.md`, in the phase that closed it |

## Import rules

Dependencies point one way. Anything else is a boundary violation and should be rejected in
review.

| Layer | May import | Must not import |
| --- | --- | --- |
| `src/design` | nothing from the app | screens, ui, native, i18n |
| `src/i18n` | `react-native` (locale only) | design, ui, screens, native |
| `src/lib` | nothing | everything else |
| `src/native` | `react-native` | design, ui, screens, i18n |
| `src/ui` | design, i18n, lib | native, screens |
| `src/screens` | design, i18n, lib, native, ui | other screens |
| `src/App.tsx` | providers and one screen | anything deeper |

Kotlin is for Android APIs, processes, the filesystem and permissions. React Native is for
UI. Business logic does not live in Kotlin, and Android APIs are not reached from JS except
through `src/native`.

## When something breaks

| Symptom | Look at |
| --- | --- |
| red screen: "Unable to load script" | `android/app/build.gradle`, `react { debuggableVariants }` |
| a string shows as a raw key | the key is missing from one dictionary in `src/i18n/messages.ts` |
| wrong language on the device | `src/i18n/device.ts`, then `resolveLanguage` in `language.ts` |
| wrong theme on the device | `src/design/ThemeProvider.tsx`, then `resolveThemeName` |
| a device fact is wrong or missing | `DevourEnvironmentModule.kt`, then `src/native/environment.ts` |
| Kotlin compile error about React Native APIs | `MainActivity.kt` / `MainApplication.kt` imports |
| resource linking error | `android/app/src/main/res/` |
| lint complains about an unknown rule | `.eslintrc.js`; Prettier is a formatter here, not a rule |
| CI android job is red | read the failure comment the workflow posts on the pull request |

## Commands

```bash
npm install                 # no lockfile yet, see AUDIT.txt
bash scripts/bootstrap-gradle-wrapper.sh

npm run lint
npm run typecheck
npm test
npm run verify              # all three

npm start                   # Metro
npm run android             # build + install debug
cd android && ./gradlew assembleDebug

# what CI checks about the artefact:
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep assets/index.android.bundle
```
