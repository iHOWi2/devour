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

Layer contracts and boundary rules live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
The visual language lives in [docs/DESIGN.md](docs/DESIGN.md). The skill format lives in
[docs/SKILL-SYSTEM.md](docs/SKILL-SYSTEM.md).

## Current status

**Phase 1 - Foundation (in progress).** What exists in code today:

- React Native 0.87 + TypeScript app shell on the new architecture with Hermes
- a Kotlin native layer with one real native module, `DevourEnvironment`, that reports device
  and storage facts and detects whether a Termux runtime host is installed
- a Phase 1 status screen built from the Devour design tokens
- Jest unit tests for the design tokens, formatting helpers and the native bridge wrapper
- GitHub Actions: lint, typecheck and tests, plus an Android job that runs `assembleDebug`
  and uploads `app-debug.apk`

The agent runtime, tools, skills, MCP and connectors are **specified in `docs/`, not stubbed
in code**. They arrive phase by phase, each with working behaviour.

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
./scripts/bootstrap-gradle-wrapper.sh
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
keystore is stored in the repository.

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

```
.
|-- android/                     Gradle project and Kotlin native layer
|   `-- app/src/main/java/com/devour/app/
|       |-- MainApplication.kt
|       |-- MainActivity.kt
|       `-- nativemodules/       DevourEnvironment module and its ReactPackage
|-- src/
|   |-- App.tsx                  Phase 1 status screen
|   |-- design/tokens.ts         colour, type, spacing and motion tokens
|   |-- lib/format.ts            pure formatting helpers
|   |-- native/                  typed wrappers over the Kotlin layer
|   `-- ui/                      small presentational components
|-- __tests__/                   Jest unit tests
|-- docs/                        architecture, design, skills, roadmap, research
`-- .github/workflows/           CI and release pipelines
```

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Research: design principles, skill architecture, MCP, RN and Android integration | done |
| 1 | Foundation: repository, RN + TypeScript, Kotlin layer, CI, debug APK | in progress |
| 2 | Chat: streaming, model abstraction, conversation state, markdown and code blocks | planned |
| 3 | Workspace: project selection, filesystem access, file tree, workspace state | planned |
| 4 | Runtime: shell execution, PTY, Termux integration, command output | planned |
| 5 | Agent tools: file tools, search, shell, Git, process control | planned |
| 6 | Skills: discovery, progressive loading, multi-skill activation | planned |
| 7 | MCP: server configuration, discovery, invocation, lifecycle, permissions | planned |
| 8 | Connectors: one real connector plus an extensible layer | planned |
| 9 | Agent UX: tool cards, permission prompts, diffs, undo, error recovery | planned |
| 10 | Polish: motion, accessibility, performance, keyboard and gestures | planned |
| 11 | Release: signed APK, GitHub release, documentation | planned |

Full deliverables and exit criteria per phase: [docs/ROADMAP.md](docs/ROADMAP.md).

## License

MIT. See [LICENSE](LICENSE).
