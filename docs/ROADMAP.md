# Roadmap

One phase at a time. A phase is done when its exit criteria hold, CI is green and the
repository documents the result. No phase starts while the previous one is red.

The gate for every phase: `npm run lint`, `npm run typecheck`, `npm test`, and an APK build
when Android code changed.

## Phase 0 - Research (done)

Design principles, skill-format practice, agent architecture, MCP layering, current React
Native and Android toolchain versions, Termux integration constraints. Findings:
[RESEARCH.md](RESEARCH.md).

## Phase 1 - Foundation (done)

- GitHub repository with README, license, contribution rules, issue and PR templates
- React Native 0.87 + TypeScript application shell, new architecture, Hermes
- Kotlin native layer with a real native module (`DevourEnvironment`) and its `ReactPackage`
- design tokens and the first screen built from them
- unit tests for tokens, formatting and the native bridge wrapper
- GitHub Actions: lint, typecheck, tests, `assembleDebug`, APK artifact

**Exit criteria:** CI green on a pull request, `app-debug.apk` downloadable from the run, the
app launches and shows real device and runtime-host facts.

**Result, 2026-09-17.** Pull request #1, workflow run
[35260611596](https://github.com/iHOWi2/devour/actions/runs/35260611596): both jobs passed and
`app-debug.apk` was uploaded as the `devour-debug-apk` artifact. The third clause - launching
on hardware - was left unverified, because the environment that produced this phase has no
device. It was then tested by hand and **failed**; Phase 1.1 fixed the cause and closed it.

CI, not guesswork, found four real defects. Each was fixed on the branch before the phase was
declared done:

| Defect                                                                                                                    | Fix                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ESLint config referenced `prettier/prettier`, but `@react-native/eslint-config` 0.87 no longer ships the plugin           | Prettier is a formatter here (`npm run format`), not an ESLint rule |
| AGP 9 refuses `getDefaultProguardFile('proguard-android.txt')` because it carries `-dontoptimize`                         | use `proguard-android-optimize.txt`                                 |
| `MainActivity.kt` used `fabricEnabled` without importing it                                                               | import `DefaultNewArchitectureEntryPoint.fabricEnabled`             |
| the app theme referenced `@drawable/rn_edit_text_material`, which lives in app resources rather than the React Native AAR | added the drawable, same content as the React Native template       |

One warning in the Android job is expected and harmless: `platforms;android-37` is not a
package id on the GitHub runner, which ships `android-37.0`, `37.1` and `37.2`. The SDK step
is best effort and logs the installed packages; the Android Gradle Plugin resolves
`compileSdk 37` on its own.

## Phase 1.1 - Runnable APK, themes and language (done)

Opened by the first install on a physical phone. The Phase 1 artefact installed, started, and
died on a red screen: _"Unable to load script. Make sure you're running Metro or that your
bundle 'index.android.bundle' is packaged correctly for release."_ The stack ended in
`loadJSBundleFromAssets`, which is React Native's fallback once no development server answers

- and it failed because the APK contained no bundle at all.

Delivered:

- `debuggableVariants = []`, so every artefact carries its own JS bundle; a running Metro
  still wins, so fast refresh is unchanged
- a CI step that greps the packaged APK and fails the job when
  `assets/index.android.bundle` is absent - an APK that cannot start is not a passing build
- dark and light themes: colour moved out of the tokens into two semantic palettes, so
  components ask for roles (`surface`, `danger`, `onAccent`) and never for hex values
- English and Russian, resolved from the device locale (`I18nManager` constants), with typed
  dictionaries that make a missing translation a typecheck error and real Russian plural
  rules (1 ядро / 2 ядра / 5 ядер)
- a settings panel behind one labelled footer row: segmented controls for theme and language,
  44 px targets, accent used as a 2 px indicator instead of a fill
- tests for theme resolution and palette parity, locale fallbacks, plural categories,
  dictionary completeness, and the screen itself rendering, switching and recovering

**Exit criteria:** CI green, the packaged APK provably contains `assets/index.android.bundle`,
and the app starts on a device with no development server, in the device's language and
appearance.

**Result, 2026-09-17.** Pull request #2, workflow run
[35266328515](https://github.com/iHOWi2/devour/actions/runs/35266328515): both jobs passed and
the new check confirmed the bundle is inside the APK. The artefact from that run was then
installed on a TECNO KJ6 (Android 13, API 33, arm64-v8a, 8 cores) with no development server:
the app launches, renders real device and storage facts, detects Termux 0.119.0-beta.3 as the
runtime host, reports the native bridge connected, and picks Russian and the dark theme from
the device settings. **All three clauses hold**, and the open Phase 1 clause is closed with
it.

Two more defects, both caught by CI rather than by reading the code:

| Defect                                                                                                                                                                                                                           | Fix                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| the debug APK shipped without `assets/index.android.bundle`, because the React Native Gradle plugin registers the bundling task only for variants that are _not_ in `debuggableVariants` (default `['debug', 'debugOptimized']`) | `debuggableVariants = []`, plus a CI check on the packaged APK                                                                 |
| the theme layer reused React Native's `ColorSchemeName`, which is `'light' \| 'dark'`, while `useColorScheme()` returns `ColorSchemeName \| null` and an unset device reports nothing                                            | the theme layer declares its own `DeviceColorScheme` and takes the widest honest input, instead of pushing a cast onto callers |

## Phase 1.2 - Navigation of the project itself (done)

A repository nobody can navigate slows every later phase, so this short iteration paid that
down before Phase 2 started.

- [MAP.md](MAP.md): every file with its purpose, a "where do I put this?" table, the import
  rules between layers, and a symptom-to-file table for debugging
- `AUDIT.txt` in the repository root: a plain-text handoff briefing - what the project is,
  what the user asked for (in their own words), the rules of engagement, what is real versus
  specified, the toolchain, the skills and references to study before writing code, the
  environment constraints that shaped the repository, every defect already hit, and what
  happens next. Phase 2 folded all of it into the documents that are updated as the code
  changes - [../CONTRIBUTING.md](../CONTRIBUTING.md), [MAP.md](MAP.md),
  [ARCHITECTURE.md](ARCHITECTURE.md), [RESEARCH.md](RESEARCH.md) and this file - and deleted
  the audit: a second copy of the rules is a copy that goes stale.
- the first defect found by a person rather than by CI, fixed in the same iteration

**Exit criteria:** CI green; a newcomer can find any file and any decision from two documents;
the device row reads correctly on real hardware.

| Defect                                                                                                                                                                     | Fix                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the device row printed the brand twice - "TECNO TECNO KJ6" - because Android reports `manufacturer` and `model` separately and many vendors put the brand inside the model | `formatDeviceName` in `src/lib/format.ts` prepends the brand only when the model does not already start with it; casing stays exactly as the platform reports it |

## Phase 2 - Chat (done)

The first phase where Devour does something for the user rather than describing itself.

Delivered:

- **`ModelProvider` as the only door to a model.** One implementation ships,
  `openai-compatible`: `POST {baseUrl}/chat/completions` with `stream: true`, `Authorization`
  sent only when a key is held so a local llama.cpp or Ollama server works, and every HTTP,
  transport and protocol failure mapped to one `AgentErrorCode`. Adding a second kind is a
  file in `src/agent/providers/` plus a line in `createProvider`.
- **Real streaming.** React Native's `fetch` has no readable body, so the transport is
  `XMLHttpRequest` and reads `responseText` as it grows; the SSE decoder is written for
  chunks that split anywhere, including mid-event and mid-UTF-8-line.
- **Conversation state as a pure reducer.** `reduceConversation(conversation, event)` has no
  effects, so the same event stream always produces the same conversation and the whole state
  machine - streaming, cancelled, failed, retry - is tested without a renderer.
- **Persistence, in Kotlin.** Two new native modules: `DevourStorage` writes named JSON
  documents into `filesDir/documents` through a temporary file and a rename, and
  `DevourSecrets` keeps the API key encrypted with AES/GCM under a non-extractable
  AndroidKeyStore key. The conversation and the endpoint settings are documents; the key is a
  secret and never enters React state or a log line.
- **A chat that tells the truth.** Turns render markdown, including a code block that is
  still arriving; the accent line appears only while a stream runs; Stop cancels the request
  and keeps the partial answer as a cancelled turn; a failure shows what the endpoint said
  with a retry that repeats the request; with no endpoint configured the screen says so and
  offers the form instead of pretending to be a chat; when the document store is missing the
  chat still works and says history is not being saved.
- **Two surfaces, one switch.** `RootScreen` swaps chat and system without a navigation
  library. The Phase 1 screen became `SystemScreen`: the endpoint form, the same real device
  facts, and the theme and language controls.
- **A streaming-tolerant markdown reader** (`src/lib/markdown.ts`): paragraphs, fenced code
  with an open-fence state, headings, lists, quotes, rules, inline code, emphasis and links.
  A library that waits for the closing fence would show nothing for seconds.
- 38 new dictionary keys in both languages; 125 tests in 15 suites.
- Repository chores that were blocked on network access: `package-lock.json` is committed, CI
  installs with `npm ci` and caches npm, and `npm run format:check` is now a CI step - which
  it had to be, because Prettier had never actually run in this repository before.

**Exit criteria:** a conversation survives rotation and process death; swapping the provider
requires no UI change; streaming can be cancelled.

**Result, 2026-09-17.** Pull request #4, workflow run
[35275846429](https://github.com/iHOWi2/devour/actions/runs/35275846429): both jobs passed on the first
attempt - lint, `format:check`, typecheck and 125 tests, then `gradle assembleDebug`, which
compiled the two new Kotlin modules, the check that the packaged APK still contains
`assets/index.android.bundle`, and the `devour-debug-apk` artefact. That is the CI level of
verification and no more: the artefact from this run has not been installed on a phone yet.

Where each clause stands, and by what evidence:

| Clause                                   | Mechanism                                                                                                                                                     | Evidence                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| survives rotation                        | `MainActivity` declares `orientation` and `screenSize` in `configChanges`, so the activity is not recreated, and the session lives in a ref above the screens | unit level; a phone has to confirm it                                             |
| survives process death                   | the conversation is a document, read once at startup; a turn left `streaming` is settled to `cancelled` on load                                               | `session.test.ts` hydrates a stored conversation; a phone has to confirm the rest |
| swapping the provider needs no UI change | screens import `useAgent` and `SessionState` only; no screen names a provider                                                                                 | `ChatScreen.test.tsx` drives the screen through an injected fake provider         |
| streaming can be cancelled               | `ModelRequest.signal` -> `xhr.abort()` -> `StreamCancelledError` -> `message.cancelled`                                                                       | `session.test.ts` and `ChatScreen.test.tsx` both stop a running stream            |

What Phase 2 does **not** claim: nobody has yet watched Devour stream from a real endpoint on
a phone. The provider is tested against a fake transport, and the transport is tested against
a fake `XMLHttpRequest`. Live streaming, keyboard behaviour with the composer, and the
restore path after a real process kill are hardware-level facts and stay unverified until the
author installs the artefact and reports back.

Defects found while building the phase:

| Defect                                                                                                                                                                                                                                                                          | Fix                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jest.resetAllMocks()` in a suite's `afterEach` also wiped the implementations inside `react-native-safe-area-context`'s own mock, which is built from `jest.fn()`; `useSafeAreaInsets()` then returned `undefined` and twelve tests failed inside `createStyles`               | reset only the mock the suite owns; the shared mock is installed once in `jest.setup.js`                                                                                                        |
| the jest mock shipped by `react-native-safe-area-context` is a default export, so `jest.mock('react-native-safe-area-context', () => require('.../jest/mock'))` installs a module namespace whose hooks are all `undefined`                                                     | the setup file installs `require('react-native-safe-area-context/jest/mock').default`                                                                                                           |
| Prettier had never run in this repository - the sandbox that built Phases 0-1.2 could not install it - so committed files were formatted by hand and `npm run format:check` would have failed                                                                                   | ran the formatter over everything and made `format:check` a CI step, with the version pinned by the new lockfile                                                                                |
| the API key never saved on a phone: `DevourSecrets` validated names with `^[a-z0-9][a-z0-9._-]{0,63}$`, and the name the app asks for is `provider.apiKey` - so every write was rejected as an invalid name. Found on hardware, in the first minute of use, by a CI-green build | both Kotlin modules accept upper case (`^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`) and a test asserts the document and secret names the application actually uses, which is the check that was missing |

## Phase 2.1 - Interface (done)

The chat worked and looked like a template. The author's verdict on the first build was
blunt: the colours were wrong, there were no animations at all, and the settings were not
settings. Black and white was the answer he asked for, and it is the right one.

This phase changed no product behaviour that Phase 2 shipped. It changed the design language,
added the motion layer, and gave the chat the affordances a chat needs.

Delivered:

- **A monochrome design language.** Every colour in both themes is now a grey - `#000000` to
  `#FFFFFF` and nine semantic roles between them - and the maximum-contrast inversion is the
  only accent. The previous warm cream and terracotta was, by the letter of the design
  research in `docs/RESEARCH.md`, the most recognisable signature of a machine-generated
  interface. Contrast is no longer a matter of taste either: `theme.test.ts` computes the WCAG
  ratio of every text role against every surface it can sit on.
- **A motion layer** (`src/design/motion.ts`): one signature curve, a four-step duration
  palette, one entrance pattern - rise and fade, decelerating - press feedback that settles
  without bounce, a caret that pulses while the machine works, a sliding segmented selection,
  and a crossfade between the two surfaces. Built on `Animated` with the native driver rather
  than a new dependency (decision 19). Every animation has a still state that carries the same
  information, so `reduce motion` is a branch and not a redesign.
- **The chat affordances.** A block caret at the end of an answer replaced the status row that
  was always on screen; copy and "again" sit under the last answer; the page follows the
  stream only while the reader is at the bottom, with a pill to jump back; the composer is one
  rounded field and one round control that stops what it started; the empty state is one large
  statement instead of a decorative phase number.
- **Copying, honestly.** `DevourClipboard` is a fourth Kotlin module (decision 20).
  `Copied` appears only after the clipboard has taken the text, and a build without the module
  shows no copy action at all rather than a button that quietly fails.
- **A settings screen that is about settings.** `SystemScreen` became `SettingsScreen` with
  four sections - model, interface, data, environment - and four endpoint presets that fill
  both fields in one tap, because typing `https://openrouter.ai/api/v1` on a phone keyboard is
  the worst moment in setting Devour up. No preset is a default: an unconfigured Devour stays
  unconfigured.
- **`regenerate` in the session**, which drops a finished answer and asks the same question
  again. Branching conversations are Phase 2.2, so this replaces rather than forks.
- 16 new dictionary keys in both languages, and a test that fails on a key the interface no
  longer shows - the dictionary cannot rot quietly. 150 tests in 15 suites.

**Exit criteria:** nothing on screen depends on a hue; every text role clears 4.5:1 on every
surface it can sit on; every animation has a still state; no screen carries a signature of a
generated interface from the list in `docs/DESIGN.md`.

**Result, 2026-09-18.** Pull request #6, workflow run
[35311528088](https://github.com/iHOWi2/devour/actions/runs/35311528088): lint,
`format:check`, typecheck and 150 tests, then `gradle assembleDebug`, which compiled the new
Kotlin clipboard module, the check that the packaged APK still contains
`assets/index.android.bundle`, and the `devour-debug-apk` artefact. Both jobs passed on the
first attempt.

What this phase does **not** claim: the interface has not been seen on a phone. Contrast is
measured, layout is not - Russian is 15-30% longer than English, and only hardware shows how
the composer behaves with a real keyboard, how the caret reads while a real endpoint streams,
and whether the monochrome strip is as unmistakable in sunlight as the test says it is.

Defects found while building the phase:

| Defect                                                                                                                                                                                 | Fix                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the first animated component took the whole suite down: the native driver calls `findNodeHandle`, and a test renderer has no host views, so `getNativeTagFromPublicInstance` is absent | `jest.setup.js` reports animations as disabled, which is React Native's own switch to the implementation that resolves every animation to its final value |
| a `setTimeout` inside `CopyAction` outlived the test that started it and logged into a torn-down jest environment                                                                      | the copy test unmounts the renderer, which is also the proof that the component clears its own timer                                                      |

## Phase 2.2 - Conversations

One conversation is a demo; a tool people use keeps several. An index document, a title taken
from the first turn, switching, renaming and deleting, and the branch that `regenerate`
deliberately does not create today. Haptics on the actions that commit something, and
edit-and-resend on your own turn, belong here too.

**Exit criteria:** several conversations survive a restart, each one titled by its own first
question; deleting one removes its document; no screen has to be redesigned to hold them.

## Phase 3 - Workspace

Project selection, scoped filesystem access, file tree, workspace state and project metadata.
This phase brings the settings store, which is what finally lets the theme and language
choice persist.

**Exit criteria:** a real project directory on the device can be opened, browsed and
remembered, with permissions handled honestly.

## Phase 4 - Runtime

Execution API, `RuntimeHost` abstraction, Termux integration, PTY, streamed command output,
cancellation. Native module migrated to a codegen TurboModule spec.

**Exit criteria:** `npm test` and `git status` run in a real project from inside Devour, with
live output and a working cancel.

## Phase 5 - Agent tools

Tool registry and the built-in set: `shell`, `read_file`, `write_file`, `edit_file`,
`list_files`, `search_files`, `git`, `process`. Permission classes and prompts.

**Exit criteria:** the agent completes a small real task end to end; every write and command
is approved by the user; adding a tool requires no runtime change.

## Phase 6 - Skills

Discovery across global, workspace and project scopes, validation, ranking, progressive
loading, multi-skill activation. First-party skills authored in the Devour format.

**Exit criteria:** several skills active at once with a measurable context budget; a broken
skill degrades visibly instead of breaking the run.

## Phase 7 - MCP

Server configuration, lifecycle, tool discovery, invocation, error mapping, per-server
permissions, pluggable transports.

**Exit criteria:** two different MCP servers work without special-casing either.

## Phase 8 - Connectors

Connector interface, credential storage, one real connector.

**Exit criteria:** the real connector performs a useful operation; adding a second one needs
no core change.

## Phase 9 - Agent UX

Tool cards, permission sheets, progress, change sets, diff view, undo, accept, error recovery.
The first phase where motion does real work: a tool card moving through pending, running and
finished states, and a change set opening into a diff, are state transitions the user has to
be able to follow.

**Exit criteria:** after any agent run the user can see what changed and undo it.

## Phase 10 - Polish

Motion, accessibility, performance, keyboard handling, gestures, one-handed reachability.

The motion work is scoped and researched, not improvised (2026-09-17):

- `react-native-reanimated` 4.6.0, released 2026-08-21, supports React Native 0.83-0.87 and
  requires the new architecture, which Devour already runs. It pairs with Worklets 0.12.x.
  Reanimated 4 adds CSS-style animations and transitions plus layout transitions, which is
  the shape this project needs: declarative state transitions, not hand-driven values.
- shared element transitions exist in Reanimated and React Navigation but both still label
  them experimental. They may be used as an accent, never as a foundation.
- LottieFiles publishes a motion-design skill (timing, easing, choreography) that fits the
  Devour skill format and is worth adapting rather than reinventing:
  <https://github.com/lottiefiles/motion-design-skill>
- the existing `motion` tokens in [DESIGN.md](DESIGN.md) - 120 ms for state, 200 ms for
  entrance, 320 ms for orchestrated sequences - stay the source of truth for durations.
- no animation dependency is installed before the phase that uses it. The first real use is
  Phase 9; Phase 10 is where it becomes a system.

**Exit criteria:** the quality floor in [DESIGN.md](DESIGN.md) holds on every screen, and
every transition either communicates a state change or is removed.

## Phase 11 - Release

Signed release APK, GitHub release with artefacts, user documentation, release automation.

**Exit criteria:** a tag produces a signed APK attached to a GitHub release.

## Deferred work

Tracked so it is not forgotten, and not pretended away:

- persist the theme and language choice: the document store exists as of Phase 2, so what is
  left is the preference documents and hydrating them before the first paint - Phase 3 owns it
  with the rest of the settings
- one conversation, not many: there is no conversation list, no title and no switching.
  `reduceConversation` is per-conversation already, so this is a storage and UI question for
  the phase that needs it
- no context-window accounting: a long conversation is truncated at 200 turns by the store and
  nothing measures tokens. Real context assembly belongs with skills and tools (Phases 5-6)
- retry repeats the last user turn; there is no per-turn edit or regenerate
- only the OpenAI-compatible protocol is implemented; Anthropic and Gemini shapes are separate
  provider kinds when they are needed
- commit the Gradle wrapper (`gradlew`, `gradle-wrapper.jar`) generated locally
- migrate `DevourEnvironment` to a codegen TurboModule spec (Phase 4)
- multi-architecture debug builds in CI (currently `arm64-v8a` for speed)
- `release.yml` is unverified: it runs only on a `v*` tag, and no tag exists yet
- replace the deprecated `DefaultReactActivityDelegate` flags constructor
- revisit `android.newDsl=false` and `android.builtInKotlin=false` before AGP 10
- validate Reanimated 4.6 against this toolchain in the phase that installs it
