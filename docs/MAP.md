# Project map

Every file in the repository, what it is for, and where to put new work. If you are looking
for a file, start here instead of grepping. If you add a file, add a line here in the same
commit - a map that lags behind the code is worse than no map.

Companion documents: [../CONTRIBUTING.md](../CONTRIBUTING.md) for the brief and the rules of
engagement, [ARCHITECTURE.md](ARCHITECTURE.md) for layer contracts,
[DESIGN.md](DESIGN.md) for the visual language, [ROADMAP.md](ROADMAP.md) for phase order,
[SKILL-SYSTEM.md](SKILL-SYSTEM.md) for the skill format, and [RESEARCH.md](RESEARCH.md) for
what was studied before writing code.

## Tree

```
devour/
|-- README.md                       what Devour is, current status, setup, roadmap summary
|-- CONTRIBUTING.md                 the brief, the rules, the gate, how a change is verified
|-- LICENSE                         MIT
|-- index.js                        React Native entry point: registers App under 'devour'
|-- app.json                        app name for the CLI and the registered component
|-- package.json                    dependencies, npm scripts, engines
|-- package-lock.json               the pinned dependency tree; CI installs with `npm ci`
|-- tsconfig.json                   extends @react-native/typescript-config, strict
|-- babel.config.js                 @react-native/babel-preset
|-- metro.config.js                 default Metro config
|-- jest.config.js                  preset: @react-native/jest-preset, setupFiles
|-- jest.setup.js                   the safe-area mock; a test renderer has no native views
|-- .eslintrc.js                    @react-native/eslint-config (no prettier plugin: decision 11)
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
|       |-- ci.yml                  js job (lint, format, typecheck, tests) + android job (APK)
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
|   |-- App.tsx                     composition root: safe area, language, theme, agent
|   |-- agent/
|   |   |-- index.ts                the only surface the UI imports from the runtime
|   |   |-- types.ts                Message, Conversation, AgentEvent, ModelProvider, settings
|   |   |-- errors.ts               AgentError codes, StreamCancelledError, failure mapping
|   |   |-- prompt.ts               the system prompt; states plainly that it has no tools yet
|   |   |-- conversation.ts         pure reducer: apply(conversation, event) -> conversation
|   |   |-- session.ts              AgentSession: send, retry, cancel, reset, hydrate, persist
|   |   |-- AgentProvider.tsx       React context over one session; holds the API key in a ref
|   |   |-- settings.ts             ProviderSettings validation and normalisation
|   |   |-- storage.ts              conversation and settings documents, the API key secret
|   |   |-- sse.ts                  server-sent-events decoder, tolerant of split chunks
|   |   |-- queue.ts                async queue turning callbacks into an AsyncIterable
|   |   |-- transport.ts            XHR streaming transport (RN fetch cannot stream)
|   |   `-- providers/
|   |       |-- index.ts            createProvider: settings -> a configured ModelProvider
|   |       `-- openaiCompatible.ts the first provider: /chat/completions with stream: true
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
|   |   |-- format.ts               pure formatters: formatBytes, formatDeviceName
|   |   `-- markdown.ts             streaming-tolerant markdown parser (blocks, inline code)
|   |-- native/
|   |   |-- bridge.ts               the only file that touches NativeModules; typed failure
|   |   |-- environment.ts          typed wrapper over the DevourEnvironment native module
|   |   |-- documents.ts            typed wrapper over DevourStorage (JSON documents)
|   |   |-- secrets.ts              typed wrapper over DevourSecrets (keystore-backed values)
|   |   `-- index.ts                public surface of the native layer
|   |-- screens/
|   |   |-- RootScreen.tsx          the chat <-> system switch; no navigation library
|   |   |-- ChatScreen.tsx          Phase 2 surface: turns, streaming, failure, composer
|   |   |-- SystemScreen.tsx        endpoint form, device facts, theme and language controls
|   |   `-- ProviderForm.tsx        the endpoint form itself: validation and its messages
|   `-- ui/
|       |-- ActionButton.tsx        primary and quiet button, 44 px target
|       |-- ChatTurn.tsx            one conversation turn: role marker and its body
|       |-- Composer.tsx            multiline input with Send, and Stop while streaming
|       |-- DataRow.tsx             label + value row with an optional state dot
|       |-- Markdown.tsx            renders the parsed markdown blocks
|       |-- PhaseMark.tsx           the large phase number and its name
|       |-- ScreenHeader.tsx        the wordmark and the screen's actions
|       |-- SectionTitle.tsx        small caps section label
|       |-- SegmentedControl.tsx    generic segmented choice, 44 px targets
|       |-- SettingsPanel.tsx       theme and language segmented controls
|       |-- StateLine.tsx           one line of state: dot, text, detail, optional action
|       `-- TextField.tsx           labelled text input with an error line
|
|-- __tests__/
|   |-- tokens.test.ts              tokens carry no colour; scales stay ordered
|   |-- theme.test.ts               palette parity, device scheme fallbacks, status bar
|   |-- i18n.test.ts                dictionary completeness, locale parsing, plural forms
|   |-- format.test.ts              formatBytes and formatDeviceName edge cases
|   |-- markdown.test.ts            parser: fences, open fences mid-stream, inline code
|   |-- environment.test.ts         native wrapper: shape validation and error mapping
|   |-- nativeStores.test.ts        document and secret wrappers: typed failure, null reads
|   |-- conversation.test.ts        the reducer: deltas, completion, cancellation, failure
|   |-- sse.test.ts                 decoder: split chunks, comments, [DONE], multiline data
|   |-- provider.test.ts            request shape, headers, chunk mapping, error mapping
|   |-- storage.test.ts             document parsers reject junk; the turn cap holds
|   |-- session.test.ts             send, stream, cancel, retry, hydrate, persistence state
|   |-- ChatScreen.test.tsx         sends, streams, stops, retries, configures, resets
|   |-- SystemScreen.test.tsx       device facts, retry, endpoint form, theme and language
|   `-- App.test.tsx                the real composition root degrades honestly with no bridge
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

| I want to ...                  | Touch                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| add or change UI copy          | `src/i18n/messages.ts` (both `en` and `ru`; a missing key fails typecheck)           |
| add a plural phrase            | `PLURAL_KEYS` + both dictionaries in `src/i18n/messages.ts`                          |
| add a language                 | `src/i18n/language.ts`, `messages.ts`, `plural.ts`, then the language control        |
| change a colour                | `src/design/theme.ts` - both palettes. Never a hex in a component                    |
| change spacing, type or motion | `src/design/tokens.ts`                                                               |
| build a reusable control       | `src/ui/`, styled from `useTheme()` and tokens                                       |
| build a screen                 | `src/screens/`, composed from `src/ui/`                                              |
| add a pure helper              | `src/lib/`, with a test next to it in `__tests__/`                                   |
| add a model provider           | `src/agent/providers/`, then one line in `createProvider`. No UI change              |
| change what the model is told  | `src/agent/prompt.ts`                                                                |
| change conversation behaviour  | `src/agent/conversation.ts` (pure) or `src/agent/session.ts` (effects)               |
| store something on the device  | a document in `src/agent/storage.ts`; secrets go to `src/native/secrets.ts`          |
| expose a new device or OS fact | Kotlin module in `android/.../nativemodules/`, then a typed wrapper in `src/native/` |
| add an npm dependency          | `package.json`, then commit the updated `package-lock.json` in the same commit       |
| change the Android build       | `android/app/build.gradle`, and re-read decision 8 in ARCHITECTURE.md first          |
| change what CI checks          | `.github/workflows/ci.yml`; a check that cannot fail is not a check                  |
| record a decision              | `docs/ARCHITECTURE.md` decisions log                                                 |
| record a defect CI caught      | `docs/ROADMAP.md`, in the phase that closed it                                       |

## Import rules

Dependencies point one way. Anything else is a boundary violation and should be rejected in
review.

| Layer         | May import                           | Must not import                    |
| ------------- | ------------------------------------ | ---------------------------------- |
| `src/design`  | nothing from the app                 | screens, ui, native, i18n, agent   |
| `src/i18n`    | `react-native` (locale only)         | design, ui, screens, native, agent |
| `src/lib`     | nothing                              | everything else                    |
| `src/native`  | `react-native`                       | design, ui, screens, i18n, agent   |
| `src/agent`   | `src/native` wrappers, `src/lib`     | design, ui, screens, i18n          |
| `src/ui`      | design, i18n, lib, agent **types**   | native, screens, agent behaviour   |
| `src/screens` | design, i18n, lib, native, ui, agent | other screens' internals           |
| `src/App.tsx` | the providers and `RootScreen`       | anything deeper                    |

`src/agent` imports React only in `AgentProvider.tsx`, which is the deliberate seam between
the runtime and the UI: everything else in the runtime is plain TypeScript and is tested
without a renderer. `src/ui` may import agent _types_ (a `ChatTurn` renders a `Message`) but
never the session, a store or a provider - a component that fetches is a component that
cannot be reused.

Kotlin is for Android APIs, processes, the filesystem and permissions. React Native is for
UI. Business logic does not live in Kotlin, and Android APIs are not reached from JS except
through `src/native`.

## When something breaks

| Symptom                                      | Look at                                                          |
| -------------------------------------------- | ---------------------------------------------------------------- |
| red screen: "Unable to load script"          | `android/app/build.gradle`, `react { debuggableVariants }`       |
| a string shows as a raw key                  | the key is missing from one dictionary in `src/i18n/messages.ts` |
| wrong language on the device                 | `src/i18n/device.ts`, then `resolveLanguage` in `language.ts`    |
| wrong theme on the device                    | `src/design/ThemeProvider.tsx`, then `resolveThemeName`          |
| a device fact is wrong or missing            | `DevourEnvironmentModule.kt`, then `src/native/environment.ts`   |
| the reply never starts, or arrives at once   | `src/agent/transport.ts`, then `src/agent/sse.ts`                |
| "history is not being saved" on the chat     | `DevourStorageModule.kt`, then `src/agent/storage.ts`            |
| the stored API key is forgotten              | `DevourSecretsModule.kt` - an undecryptable blob is dropped      |
| the endpoint answers but nothing renders     | `src/agent/providers/openaiCompatible.ts` chunk mapping          |
| Kotlin compile error about React Native APIs | `MainActivity.kt` / `MainApplication.kt` imports                 |
| resource linking error                       | `android/app/src/main/res/`                                      |
| lint complains about an unknown rule         | `.eslintrc.js`; Prettier is a formatter here, not a rule         |
| CI android job is red                        | read the failure comment the workflow posts on the pull request  |

## Commands

```bash
npm ci                      # the lockfile is committed; npm install only to change it
bash scripts/bootstrap-gradle-wrapper.sh

npm run lint
npm run format:check        # CI fails on unformatted files; `npm run format` fixes them
npm run typecheck
npm test
npm run verify              # lint + typecheck + tests

npm start                   # Metro
npm run android             # build + install debug
cd android && ./gradlew assembleDebug

# what CI checks about the artefact:
unzip -l android/app/build/outputs/apk/debug/app-debug.apk | grep assets/index.android.bundle
```
