# Phase 0 - Research

What was studied before writing code, and what it changed in the plan.

## Design principles

Source: the frontend-design skill published in Anthropic's official plugin repository
(`plugins/frontend-design/skills/frontend-design/SKILL.md`). Nothing from it is copied; the
principles that shaped [DESIGN.md](DESIGN.md) are:

- ground the visual direction in the subject matter; the hero element should be the most
  characteristic thing about the product, not a decorative header
- one or two deliberate typefaces with a real type scale; keep prose line length short
- structural devices must encode information - numbered markers only for real sequences
- spend boldness in exactly one place per screen
- motion the user did not trigger is limited to one orchestrated moment
- named AI-slop patterns to avoid: cream + serif + terracotta, near-black with an acid
  accent, SaaS card kits, tracked-out all-caps eyebrows, arrows inside button labels
- a quality floor is part of the design: focus states, reduced motion, contrast, honest empty
  and error states

Applied to Devour: the subject matter is a machine working on your code, so the direction is
an instrument chassis with warm text, one molten accent, monospace reserved for machine truth,
and the roadmap phase number as the single bold element on the Phase 1 screen.

## Skill architecture

Sources: the skill-development skill and the example skill in the same repository. What we
took into [SKILL-SYSTEM.md](SKILL-SYSTEM.md):

- three-level progressive disclosure: always-present metadata, an on-demand body, unbounded
  bundled resources
- descriptions written in third person that state *when* to use the skill, because that text
  is the only thing always in context
- bodies written as imperative instructions, kept small; no duplication between body and
  references
- bundled `references/`, `examples/` and `scripts/` directories, with grep hints for large
  references
- validation as a first-class step

Deviations, on purpose: Devour adds explicit discovery scopes (project / workspace / global)
with precedence, a `requires` field, Git-based skill sources, and a context budget for
multi-skill activation. The format is not tied to any vendor's runtime.

## Agent architecture, tools, MCP

- the runtime is the only component that talks to a model; the UI consumes an event stream
- external tools from MCP are adapted into the same tool interface as built-in tools, so the
  orchestrator does not branch on their origin
- MCP owns server lifecycle, discovery, invocation, error mapping and per-server permissions;
  transports stay pluggable per the specification
- connectors are services with credentials, which is a different problem from tools, so they
  get their own layer

## Toolchain (pinned)

| Component | Version | Note |
| --- | --- | --- |
| React Native | 0.87.1 | latest stable at the time of Phase 1 |
| React | 19.2.3 | required peer of RN 0.87 |
| TypeScript | 6.x | via `@react-native/typescript-config` |
| Kotlin | 2.2.0 | React Native 0.87 template default |
| Gradle | 9.4.1 | provisioned in CI, wrapper generated locally |
| Android compile SDK | 37 | template default |
| Android target SDK | 36 | template default |
| Android min SDK | 24 | template default |
| JDK | 21 | used by CI |
| New architecture | enabled | RN 0.87 default |
| Hermes | enabled | RN 0.87 default |

The application configuration follows the official `react-native-community/template` at the
`0.87-stable` branch, so future React Native upgrades stay mechanical.

## React Native native modules

`ReactPackage.createNativeModules` is deprecated in 0.87 in favour of `BaseReactPackage` with
`getModule` and a `ReactModuleInfoProvider`, which also gives lazy instantiation. Devour's
package uses the new API. Codegen TurboModule specs are the next step and are scheduled for
Phase 4, when the native surface grows beyond read-only facts.

## Termux and runtime integration

- Termux is a separate application (`com.termux`); Android package visibility rules mean an
  app must declare a `<queries>` entry to see it at all. Phase 1 declares it and detects the
  package, which is the first honest step of the runtime contract.
- Command execution will use Termux's `RUN_COMMAND` intent path, which additionally requires
  the user to enable external apps in Termux settings - a permission and onboarding problem,
  not just an API problem. Phase 4 handles it.
- Because a runtime host may be missing, refused or replaced, execution sits behind a
  `RuntimeHost` interface from the start.

## Build constraints found while setting up

| Constraint | Consequence |
| --- | --- |
| Binary files are not committed to this repository | no `gradle-wrapper.jar`, no debug keystore; CI provisions Gradle, the Android Gradle Plugin manages debug signing |
| No `package-lock.json` yet | CI uses `npm install` and no npm cache; switching to `npm ci` is tracked in the roadmap |
| Android NDK is not needed | the app has no C++ of its own, so `ndkVersion` is not pinned in the app module and CI does not download an NDK |
| Debug builds skip JS bundling | `assembleDebug` needs no Hermes compilation step in CI |
