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
`app-debug.apk` was uploaded as the `devour-debug-apk` artifact. The third clause -
launching on hardware - is **not** verified: the environment that produced this phase has no
device and no network, so it carries into Phase 2 as the first thing to confirm.

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

## Phase 2 - Chat (next)

Streaming responses, `ModelProvider` abstraction, conversation state, markdown and code block
rendering, error and retry states. Also closes the open Phase 1 clause: install and launch the
debug APK on a real device.

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

- install and launch `app-debug.apk` on a physical device (open half of Phase 1)
- commit `package-lock.json` once it is generated on a machine with network access; switch CI
  to `npm ci`
- commit the Gradle wrapper (`gradlew`, `gradle-wrapper.jar`) generated locally
- migrate `DevourEnvironment` to a codegen TurboModule spec (Phase 4)
- multi-architecture debug builds in CI (currently `arm64-v8a` for speed)
- enforce Prettier formatting as a CI error once the toolchain is pinned by a lockfile
- `release.yml` is unverified: it runs only on a `v*` tag, and no tag exists yet
