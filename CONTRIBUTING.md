# Contributing to Devour

Devour is built phase by phase. The rules below exist so the project stays buildable and
honest at every commit.

## The iteration loop

Every change follows the same loop:

```
Inspect -> Implement -> Build -> Test -> Fix -> Commit -> Document
```

1. **Inspect** the existing code before adding to it. Do not rewrite working layers to add a
   feature next to them.
2. **Implement** the smallest version that actually works.
3. **Build and test** locally (see the gate below).
4. **Fix** what broke, including architectural problems. A broken foundation is never a base
   for the next phase.
5. **Commit** with a conventional-commit message.
6. **Document**: update `README.md` "Current status" and `docs/ROADMAP.md` when a phase moves.

## Quality gate

A change is done when all of these pass:

```bash
npm run lint
npm run typecheck
npm test
```

and, when anything under `android/` or any native binding changed:

```bash
cd android && ./gradlew assembleDebug
```

CI runs the same gate on every push and pull request, and uploads the debug APK as an
artifact. A pull request is not mergeable while CI is red.

## Rules that are not negotiable

- **No fake implementations.** A mock service, a stubbed integration or a screen that only
  renders sample data is not a feature. Ship a smaller real thing instead.
- **Respect the layers.** The UI never imports a model provider or a runtime implementation.
  The agent runtime never imports Termux-specific code. Kotlin code never contains UI logic.
  See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Skills are not tools.** A skill describes how to do work; a tool is a capability the agent
  can invoke. Do not add behaviour to one that belongs to the other.
- **Dangerous actions need consent.** Anything that writes files, runs a shell command,
  touches the network or calls an external tool must go through the permission layer once that
  layer exists (Phase 5 and later), and must be visible in the UI before it happens.
- **One phase at a time.** Do not start the next phase while the current one is red or
  undocumented.

## Commits and branches

- Branches: `phase-<n>/<topic>`, for example `phase-2/streaming-chat`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `refactor:`.
- Keep commits scoped. Repository chores, documentation and code arrive as separate commits.

## Code style

- TypeScript everywhere in `src/`. No `any` unless there is a comment explaining why.
- Kotlin for the native layer, one responsibility per file, no Android APIs leaking into JS
  beyond the typed wrappers in `src/native/`.
- Formatting: `npm run format` (Prettier). ESLint reports formatting drift as a warning and
  real problems as errors.
- Design tokens live in `src/design/tokens.ts`. No hard-coded colours, spacing or font sizes
  in components.

## Reporting problems

Open an issue with the phase or area (chat, workspace, runtime, tools, skills, MCP), the
device and Android version, and the exact command or action that failed.
