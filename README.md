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

| Document                                     | What it answers                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| [docs/MAP.md](docs/MAP.md)                   | where every file lives and where new work belongs                      |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | the brief, the rules of engagement, the gate, how a change is verified |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | layer contracts, import rules, decisions log                           |
| [docs/DESIGN.md](docs/DESIGN.md)             | visual direction, palettes, type, spacing, motion, quality floor       |
| [docs/SKILL-SYSTEM.md](docs/SKILL-SYSTEM.md) | the Devour skill format and how skills load                            |
| [docs/ROADMAP.md](docs/ROADMAP.md)           | phases, exit criteria, defects closed, deferred work                   |
| [docs/RESEARCH.md](docs/RESEARCH.md)         | Phase 0 findings and version research                                  |

Start with `CONTRIBUTING.md` if you are new to the project, then `docs/MAP.md`.

## Current status

**Phase 2.2 - Interface, second pass: done, verified in CI.** Workflow run
[35314932414](https://github.com/iHOWi2/devour/actions/runs/35314932414), 2026-09-18: `lint,
typecheck, tests` and `android debug apk` both passed on the first attempt, the Android job
autolinking `react-native-svg` into the APK. The Phase 2.1 build was installed on a phone,
and the screenshot that came back showed the send button drawing two empty boxes: the Unicode
arrow it used is absent from that device's font. Every icon is now vector geometry
(`src/ui/Icon.tsx`, seven of them), and nothing user facing is a text character any more. The
dark theme came off the extremes - `#FFFFFF` on `#000000` is 21:1, which on an OLED panel is
glare, so the page is `#141414` and the text `#E8E8E8` - motion moved to a curve that settles
instead of landing hard, three placeholder bars now stand where an arriving answer will be, a
finished listing over 14 lines folds with its hidden line count on the button, and a large
system font can no longer inflate code or a headline out of the layout.

The Phase 1.1 artefact was verified by hand on a TECNO KJ6 (Android 13, API 33, arm64-v8a):
the app launches with no development server, reports real device and storage facts, detects
Termux as the runtime host, and picks Russian and the dark theme from the device settings. The
Phase 2.1 artefact was installed and photographed, which is what found the broken glyph.
**This build has not been on a phone yet**, so how the drawn icons and the calmer palette
actually read under a thumb is still unverified.

What exists in code today:

- React Native 0.87 + TypeScript app shell on the new architecture with Hermes
- a **chat** that talks to any OpenAI-compatible endpoint: streamed answers rendered as
  markdown while they arrive with a caret at the end, a Stop that actually cancels the
  request, copy and "again" on an answer, a failure strip carrying the endpoint's own words
  with a retry, and an honest empty state when no endpoint is configured
- a **monochrome interface** - black, white and the greys between them, no hue anywhere, and
  neither pure extreme - with one motion identity: a single entrance pattern on a curve that
  settles, press feedback, an icon that scales in when a control changes what it does, a
  sliding segmented selection, a crossfade between surfaces, and every animation with a still
  state that says the same thing - reduced motion is a setting, not a rewrite
- **seven drawn icons** (`react-native-svg`) and not one text glyph: a character an unknown
  font lacks renders as an empty box, which is exactly how this was found
- an **agent runtime** (`src/agent`) behind one interface: `ModelProvider`, a pure
  conversation reducer, an `AgentSession` that owns send, retry, cancel and restore, and a
  React context that is the UI's only door into it
- a **Kotlin native layer** with four real modules: `DevourEnvironment` (device, storage and
  runtime-host facts), `DevourStorage` (JSON documents written atomically into the app's
  private files directory), `DevourSecrets` (AES/GCM under a non-extractable AndroidKeyStore
  key, which is where the API key lives) and `DevourClipboard`
- the conversation and the endpoint settings survive a restart; when the native store is
  missing, the chat still runs and says history is not being saved
- dark and light themes, following the device appearance setting unless overridden
- English and Russian, following the device locale unless overridden, with real Russian plural
  rules
- 171 Jest tests across 16 suites: the reducer, the SSE decoder, the provider, the transport
  boundary, the markdown reader, the document, secret and clipboard wrappers, the session
  state machine, measured colour contrast, and both screens
- GitHub Actions: lint, format, typecheck and tests, plus an Android job that runs
  `assembleDebug`, proves the JS bundle is packaged, and uploads `app-debug.apk`

**Fixed after the first install on hardware.** A stock React Native debug build packages no
JS bundle: the Gradle plugin registers the bundling task only for variants that are _not_
listed in `debuggableVariants`, which defaults to `['debug', 'debugOptimized']`. That is fine
with Metro running over USB and useless for an APK downloaded from CI onto a phone, which
installed and then died on "Unable to load script". Devour sets `debuggableVariants = []`, so
every artifact is self-contained, and CI now fails when the bundle is missing instead of
shipping an APK that cannot start. A running Metro still takes priority, so fast refresh is
unchanged.

What is **not** done yet, and is not pretended to be:

- nobody has yet watched a real endpoint stream onto a phone. The provider is tested against
  a fake transport; live streaming, keyboard feel, the restore path after a real process kill
  and how the new interface reads in the hand wait for a hardware report
- there is one conversation, with no list, no titles and no token accounting
- the theme and language choice still lives for the session only; the document store exists
  now, so Phase 3 wires the preference documents with the rest of the settings
- the agent has **no tools**: it cannot read a file or run a command, and its system prompt
  says so plainly. Workspace, runtime, tools, skills, MCP and connectors are specified in
  `docs/`, not stubbed in code, and arrive phase by phase

## Requirements

| Tool                 | Version  |
| -------------------- | -------- |
| Node.js              | >= 22.11 |
| JDK                  | 21       |
| Android SDK platform | 37       |
| Android build tools  | 37.0.0   |
| Gradle               | 9.4.1    |

## Setup

```bash
npm ci

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
npm run format:check   # `npm run format` fixes what it reports
npm run typecheck
npm test
npm run verify         # lint + typecheck + tests
```

Every iteration ends with the same gate: lint, typecheck, tests, and an APK build whenever
Android code changed. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Project layout

Full annotated map, including where new work belongs: [docs/MAP.md](docs/MAP.md).

```
.
|-- android/                     Gradle project and Kotlin native layer
|   `-- app/src/main/java/com/devour/app/
|       |-- MainApplication.kt
|       |-- MainActivity.kt
|       `-- nativemodules/       DevourEnvironment, Storage, Secrets, Clipboard
|-- src/
|   |-- App.tsx                  composition root: safe area, language, theme, agent
|   |-- agent/                   the runtime: providers, session, conversation, storage
|   |-- design/                  tokens, both palettes, motion hooks, ThemeProvider
|   |-- i18n/                    dictionaries, plural rules, LanguageProvider
|   |-- lib/                     pure helpers: formatting, the markdown reader
|   |-- native/                  typed wrappers over the Kotlin layer
|   |-- screens/                 RootScreen, ChatScreen, SettingsScreen
|   `-- ui/                      small presentational components
|-- __tests__/                   Jest unit tests
|-- docs/                        map, architecture, design, skills, roadmap, research
`-- .github/workflows/           CI and release pipelines
```

## Roadmap

| Phase | Scope                                                                             | Status  |
| ----- | --------------------------------------------------------------------------------- | ------- |
| 0     | Research: design principles, skill architecture, MCP, RN and Android integration  | done    |
| 1     | Foundation: repository, RN + TypeScript, Kotlin layer, CI, runnable debug APK     | done    |
| 1.1   | Themes (dark, light) and localisation (English, Russian) from device settings     | done    |
| 1.2   | Navigation of the project itself: the map, the handoff briefing, the device row   | done    |
| 2     | Chat: streaming, model abstraction, conversation state, markdown and code blocks  | done    |
| 2.1   | Interface: monochrome design language, motion, chat affordances, settings screen  | done    |
| 3     | Workspace: project selection, filesystem access, file tree, workspace state       | planned |
| 4     | Runtime: shell execution, PTY, Termux integration, command output                 | planned |
| 5     | Agent tools: file tools, search, shell, Git, process control                      | planned |
| 6     | Skills: discovery, progressive loading, multi-skill activation                    | planned |
| 7     | MCP: server configuration, discovery, invocation, lifecycle, permissions          | planned |
| 8     | Connectors: one real connector plus an extensible layer                           | planned |
| 9     | Agent UX: tool cards, permission prompts, diffs, undo, error recovery             | planned |
| 10    | Polish: motion and transitions, accessibility, performance, keyboard and gestures | planned |
| 11    | Release: signed APK, GitHub release, documentation                                | planned |

Full deliverables and exit criteria per phase: [docs/ROADMAP.md](docs/ROADMAP.md).

## License

MIT. See [LICENSE](LICENSE).
