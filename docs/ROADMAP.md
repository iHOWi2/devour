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
device. It was then tested by hand and **failed**: see Phase 1.1.

CI, not guesswork, found four real defects. Each was fixed on the branch before the phase was
declared done:

| Defect | Fix |
| --- | --- |
| ESLint config referenced `prettier/prettier`, but `@react-native/eslint-config` 0.87 no longer ships the plugin | Prettier is a formatter here (`npm run format`), not an ESLint rule |
| AGP 9 refuses `getDefaultProguardFile('proguard-android.txt')` because it carries `-dontoptimize` | use `proguard-android-optimize.txt` |
| `MainActivity.kt` used `fabricEnabled` without importing it | import `DefaultNewArchitectureEntryPoint.fabricEnabled` |
| the app theme referenced `@drawable/rn_edit_text_material`, which lives in app resources rather than the React Native AAR | added the drawable, same content as the React Native template |

One warning in the Android job is expected and harmless: `platforms;android-37` is not a
package id on the GitHub runner, which ships `android-37.0`, `37.1` and `37.2`. The SDK step
is best effort and logs the installed packages; the Android Gradle Plugin resolves
`compileSdk 37` on its own.

## Phase 1.1 - Runnable APK, themes and language (done)

Opened by the first install on a physical phone. The Phase 1 artefact installed, started, and
died on a red screen: *"Unable to load script. Make sure you're running Metro or that your
bundle 'index.android.bundle' is packaged correctly for release."* The stack ended in
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
[35265672687](https://github.com/iHOWi2/devour/actions/runs/35265672687): both jobs passed and
the new check confirmed the bundle is inside the APK. The device clause stays open until the
artefact from that run has been installed and launched.

Two more defects, both caught by CI rather than by reading the code:

| Defect | Fix |
| --- | --- |
| the debug APK shipped without `assets/index.android.bundle`, because the React Native Gradle plugin registers the bundling task only for variants that are *not* in `debuggableVariants` (default `['debug', 'debugOptimized']`) | `debuggableVariants = []`, plus a CI check on the packaged APK |
| the theme layer reused React Native's `ColorSchemeName`, which is `'light' \| 'dark'`, while `useColorScheme()` returns `ColorSchemeName \| null` and an unset device reports nothing | the theme layer declares its own `DeviceColorScheme` and takes the widest honest input, instead of pushing a cast onto callers |

## Phase 2 - Chat (next)

Streaming responses, `ModelProvider` abstraction, conversation state, markdown and code block
rendering, error and retry states. Also closes the open Phase 1.1 clause: install and launch
the bundled debug APK on a real device.

**Exit criteria:** a conversation survives rotation and process death; swapping the provider
requires no UI change; streaming can be cancelled.

## Phase 3 - Workspace

Project selection, scoped filesystem access, file tree, workspace state and project metadata.

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

**Exit criteria:** after any agent run the user can see what changed and undo it.

## Phase 10 - Polish

Motion, accessibility, performance, keyboard handling, gestures, one-handed reachability.

**Exit criteria:** the quality floor in [DESIGN.md](DESIGN.md) holds on every screen.

## Phase 11 - Release

Signed release APK, GitHub release with artefacts, user documentation, release automation.

**Exit criteria:** a tag produces a signed APK attached to a GitHub release.

## Deferred work

Tracked so it is not forgotten, and not pretended away:

- install and launch the bundled `app-debug.apk` on a physical device (open half of
  Phase 1.1)
- persist the theme and language choice; there is no settings store before Phase 3, so today
  the choice lives for the session and the device setting is the default
- commit `package-lock.json` once it is generated on a machine with network access; switch CI
  to `npm ci`
- commit the Gradle wrapper (`gradlew`, `gradle-wrapper.jar`) generated locally
- migrate `DevourEnvironment` to a codegen TurboModule spec (Phase 4)
- multi-architecture debug builds in CI (currently `arm64-v8a` for speed)
- enforce Prettier formatting as a CI error once the toolchain is pinned by a lockfile
- `release.yml` is unverified: it runs only on a `v*` tag, and no tag exists yet
