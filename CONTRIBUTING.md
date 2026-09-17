# Contributing to Devour

Devour is built phase by phase. The rules below exist so the project stays buildable and
honest at every commit.

New here? Read this file, then [docs/MAP.md](docs/MAP.md) (where every file lives), then
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (layer contracts and the decisions log), then
[docs/ROADMAP.md](docs/ROADMAP.md) (phase order, exit criteria, defects already hit).

## The brief, in the author's words

Devour is built for one person who works from a phone and describes intent to an agent. These
are their stated requirements, in Russian, with the working translation - they outrank any
preference a contributor brings:

| Requirement                                                            | Meaning                                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| «2 языка, англ и ру (по умолчанию устройство)»                         | English and Russian; the device setting is the default. Done in Phase 1.1.              |
| «темы белая и темная»                                                  | Light and dark themes, device setting first. Done in Phase 1.1.                         |
| «ui там по скиллам так же делаешь чо там надо»                         | Build the UI from the studied design skill, not from improvisation.                     |
| «на будущее анимации плавные особые, переходы и т.п современная фигня» | Later: deliberate motion and transitions. Research existing motion skills; Phases 9-10. |
| «Советую сделать MAP проэкта чтобы не теряться по проекту»             | A project map so nobody hunts for files. Done: [docs/MAP.md](docs/MAP.md).              |
| «Не создавай fake implementations»                                     | No stubs dressed as features. A small working system beats a large fake one.            |
| «НЕ ДЕЛАЙ ВЕСЬ ПРОЕКТ ЗА ОДИН ПРОХОД»                                  | Do not build everything in one pass, and do not rewrite the project to add to it.       |
| «Не говори, что CI работает, пока реально не проверишь workflow»       | Claim nothing works until a run proves it. Say what is verified and what is not.        |

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
npm run format:check
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
  renders sample data is not a feature. Ship a smaller real thing instead. A composer that
  cannot send a message is a lie about the build; that is why Phase 1 had no chat input.
- **Verified means someone ran it.** CI green is a CI claim. "Runs on a device" requires an
  install on a device. Write down which of the two you have.
- **Study before writing.** The references that shaped the design and the skill format are
  listed in [docs/RESEARCH.md](docs/RESEARCH.md). Read the relevant one instead of guessing.
- **Fix the foundation first.** An architectural problem found mid-phase is fixed in that
  phase, not filed for later.
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

## How a change is verified

There is no emulator farm and no local Android build in the environments this project is
worked from, so verification has exactly three levels. Name the level you reached:

1. **Unit level** - `npm run lint`, `npm run typecheck`, `npm test`. Fast, and the only thing
   that runs offline.
2. **CI level** - the Actions run on the pull request, including `gradle assembleDebug` and
   the check that the packaged APK contains `assets/index.android.bundle`. This is the only
   automated proof that the Android side compiles and packages.
3. **Hardware level** - the author installs the `devour-debug-apk` artefact from the run on a
   real phone and reports back with screenshots. Nothing else in this project touches
   hardware, so anything only the phone can show - keyboard behaviour, live streaming from a
   real endpoint, fonts, gesture feel - stays unverified until that report arrives.

The CI workflow posts its own failure logs as a pull request comment. Keep that: the failure
is then readable where the change is reviewed.

## Why the repository looks like this

Phases 0 to 1.2 were built from a sandbox with no network and no device, which explains a few
things that otherwise look like mistakes:

- **No Gradle wrapper binary.** `gradlew` and `gradle-wrapper.jar` are absent because binary
  files could not be committed. Run `bash scripts/bootstrap-gradle-wrapper.sh` once locally;
  CI provisions Gradle itself.
- **Docs describe unbuilt layers.** Contracts for tools, skills, MCP and connectors live in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) marked **design** rather than as stubs in
  `src/`, so nothing in the repository pretends to work.
- **No committed keystore.** Debug builds use the Android Gradle Plugin's managed debug
  keystore; release signing reads `DEVOUR_RELEASE_*` from the environment.

`package-lock.json` is committed as of Phase 2, so `npm ci` is the install command in CI and
`npm run format:check` is enforced there.

## Commits and branches

- Branches: `phase-<n>/<topic>`, for example `phase-2/streaming-chat`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `refactor:`.
- Keep commits scoped. Repository chores, documentation and code arrive as separate commits.

## Code style

- TypeScript everywhere in `src/`. No `any` unless there is a comment explaining why.
- Kotlin for the native layer, one responsibility per file, no Android APIs leaking into JS
  beyond the typed wrappers in `src/native/`.
- Formatting: `npm run format` (Prettier 2.8.8, pinned). CI runs `npm run format:check`, so
  unformatted files fail the build. Prettier is not an ESLint rule here; ESLint reports real
  problems only.
- Design tokens live in `src/design/tokens.ts`. No hard-coded colours, spacing or font sizes
  in components.

## Reporting problems

Open an issue with the phase or area (chat, workspace, runtime, tools, skills, MCP), the
device and Android version, and the exact command or action that failed.
