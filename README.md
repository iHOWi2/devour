# Devour

**Mobile-first AI coding workspace for Android.**

Devour puts a coding agent on the device, next to a real project. It is not a chat app with
syntax highlighting, and not a desktop IDE shrunk to a phone screen. You describe a change;
the agent inspects the project, plans, edits files, runs commands in a real shell, and shows
you exactly what it touched.

## Vision

> "A coding agent lives on my phone. I give it a project and a task; it explores, plans,
> edits files, runs commands, tests the result, and shows me the diff."

Four commitments shape every decision:

- **Chat is the surface, the workspace is real.** Typing long code on a touch keyboard is a
  dead end; describing intent is not.
- **Nothing dangerous happens silently.** Shell commands, destructive operations, network
  access and external tools are asked for, never assumed.
- **Clear separation of concerns.** Skills describe _how_ to work, tools describe _what_ can
  be done, MCP brings external tool providers, connectors bring external services.
- **Replaceable parts.** The model provider and the execution runtime (Termux today) sit
  behind interfaces, so neither one is welded to the UI.

## What Devour is not

- a miniature VS Code
- Material CRUD screens and endless cards
- a Claude or ChatGPT clone
- mock integrations that look like features

## Architecture

```
User
  |
  v
Devour Mobile UI            React Native + TypeScript
  |
  v
Agent Runtime               model, context, planning, permissions
  |
  v
Tools | Skills | MCP | Connectors
  |
  v
Native Android Layer        Kotlin: filesystem, processes, PTY, permissions
  |
  v
Local Runtime               Termux today, replaceable behind an interface
  |
  v
Real workspace on the device
```

## Documentation

| Document | What it answers |
| --- | --- |
| [docs/MAP.md](docs/MAP.md) | where every file lives and where new work belongs |
| [AUDIT.txt](AUDIT.txt) | handoff briefing: the project, the user's requirements, the rules, the landmines |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | layer contracts, import rules, decisions log |
| [docs/DESIGN.md](docs/DESIGN.md) | visual direction, palettes, type, spacing, motion, quality floor |
| [docs/SKILL-SYSTEM.md](docs/SKILL-SYSTEM.md) | the Devour skill format and how skills load |
| [docs/ROADMAP.md](docs/ROADMAP.md) | phases, exit criteria, defects closed, deferred work |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Phase 0 findings and version research |

Start with `AUDIT.txt` if you are new to the project, then `docs/MAP.md`.

## Current status

**Phase 1 - Foundation: done, verified in CI and on a real phone.** Workflow run
[35266328515](https://github.com/iHOWi2/devour/actions/runs/35266328515), 2026-09-17:

- `lint, typecheck, tests` - passed
- `android debug apk` - passed: `gradle assembleDebug` produced
  `android/app/build/outputs/apk/debug/app-debug.apk`, the packaged APK is checked to contain
  `assets/index.android.bundle`, and it is uploaded as the `devour-debug-apk` artifact
- that artifact was installed on a TECNO KJ6 (Android 13, API 33, arm64-v8a) with no
  development server running: the app launches, reports real device and storage facts,
  detects Termux 0.119.0-beta.3 as the runtime host, and picks Russian and the dark theme
  from the device settings

What exists in code today:

- React Native 0.87 + TypeScript app shell on the new architecture with Hermes
- a Kotlin native layer with one real native module, `DevourEnvironment`, that reports device
  and storage facts and detects whether a Termux runtime host is installed
- dark and light themes, following the device appearance setting unless overridden
- English and Russian, following the device locale unless overridden, with real Russian
  plural rules
- a Phase 1 status screen built from the Devour design tokens, with theme and language
  controls revealed by a single footer row
- Jest unit tests for the design tokens, the themes, localisation, formatting helpers, the
  native bridge wrapper and the screen itself
- GitHub Actions: lint, typecheck and tests, plus an Android job that runs `assembleDebug`,
  proves the JS bundle is packaged, and uploads `app-debug.apk`

**Fixed after the first install on hardware.** A stock React Native debug build packages no
JS bundle: the Gradle plugin registers the bundling task only for variants that are *not*
listed in `debuggableVariants`, which defaults to `['debug', 'debugOptimized']`. That is fine
with Metro running over USB and useless for an APK downloaded from CI onto a phone, which
installed and then died on "Unable to load script". Devour sets `debuggableVariants = []`, so
every artifact is self-contained, and CI now fails when the bundle is missing instead of
shipping an APK that cannot start. A running Metro still takes priority, so fast refresh is
unchanged.

What is **not** done yet: theme and language choices live for the session only, because
there is no settings store before Phase 3 and a fake one would be a lie. The agent runtime,
tools, skills, MCP and connectors are **specified in `docs/`, not stubbed in code**. They
arrive phase by phase, each with working behaviour.

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | >= 22.11 |
| JDK | 21 |
| Android SDK platform | 37 |
| Android build tools | 37.0.0 |
| Gradle | 9.4.1 |

## Setup

```bash
npm install

# one-time: binary JARs are not committed, so generate the Gradle wrapper locally
bash scripts/bootstrap-gradle-wrapper.sh
```

Run the app on a connected device or emulator:

```bash
npm start          # Metro bundler
npm run android    # build + install a debug build
```

Build an APK directly:

```bash
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

The debug build is signed with the Android Gradle Plugin's managed debug keystore, so no
keystore is stored in the repository. It also carries its own JS bundle, so it runs without a
development server.

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run verify     # lint + typecheck + tests
```

Every iteration ends with the same gate: lint, typecheck, tests, and an APK build whenever
Android code changed. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Project layout

Full annotated map, including where new work belongs: [docs/MAP.md](docs/MAP.md).

```
.
|-- AUDIT.txt                    handoff briefing for the next developer
|-- android/                     Gradle project and Kotlin native layer
|   `-- app/src/main/java/com/devour/app/
|       |-- MainApplication.kt
|       |-- MainActivity.kt
|       `-- nativemodules/       DevourEnvironment module and its ReactPackage
|-- src/
|   |-- App.tsx                  composition root: theme and language providers
|   |-- design/                  tokens, both palettes, ThemeProvider
|   |-- i18n/                    dictionaries, plural rules, LanguageProvider
|   |-- lib/format.ts            pure formatting helpers
|   |-- native/                  typed wrappers over the Kotlin layer
|   |-- screens/                 FoundationScreen - the Phase 1 status screen
|   `-- ui/                      small presentational components
|-- __tests__/                   Jest unit tests
|-- docs/                        map, architecture, design, skills, roadmap, research
`-- .github/workflows/           CI and release pipelines
```

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Research: design principles, skill architecture, MCP, RN and Android integration | done |
| 1 | Foundation: repository, RN + TypeScript, Kotlin layer, CI, runnable debug APK | done |
| 1.1 | Themes (dark, light) and localisation (English, Russian) from device settings | done |
| 2 | Chat: streaming, model abstraction, conversation state, markdown and code blocks | next |
| 3 | Workspace: project selection, filesystem access, file tree, workspace state | planned |
| 4 | Runtime: shell execution, PTY, Termux integration, command output | planned |
| 5 | Agent tools: file tools, search, shell, Git, process control | planned |
| 6 | Skills: discovery, progressive loading, multi-skill activation | planned |
| 7 | MCP: server configuration, discovery, invocation, lifecycle, permissions | planned |
| 8 | Connectors: one real connector plus an extensible layer | planned |
| 9 | Agent UX: tool cards, permission prompts, diffs, undo, error recovery | planned |
| 10 | Polish: motion and transitions, accessibility, performance, keyboard and gestures | planned |
| 11 | Release: signed APK, GitHub release, documentation | planned |

Full deliverables and exit criteria per phase: [docs/ROADMAP.md](docs/ROADMAP.md).

## License

MIT. See [LICENSE](LICENSE).
