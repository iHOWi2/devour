# Architecture

This document defines the layers of Devour, what each layer owns, and what it is allowed to
import. It is the contract that keeps later phases from turning into a monolith.

Contracts marked **design** are specifications for a later phase. They are written here
instead of being stubbed in code, so that nothing in the repository pretends to work.

## Principles

1. **One direction of dependency.** UI depends on the runtime; the runtime depends on
   capability providers; capability providers depend on the native layer. Never the reverse.
2. **Every external thing is behind an interface.** Model providers, runtimes, MCP transports
   and connectors are replaceable without touching the UI.
3. **State is explicit.** Tool calls, permissions and file changes are observable state
   machines, not side effects hidden inside a chat renderer.
4. **Nothing dangerous is implicit.** Any effect on the device goes through the permission
   layer and is visible before it happens.

## Layer map

```
+-------------------------------------------------------------+
| UI            src/screens, src/ui, src/design, src/i18n     |
|               React Native + TypeScript. Renders state,     |
|               sends intents. Knows nothing about models.    |
+-------------------------------------------------------------+
| Agent runtime src/agent                                     |
|               Conversation, planning, context assembly,     |
|               tool orchestration, permission decisions.     |
+-------------------------------------------------------------+
| Capabilities  src/tools | src/skills | src/mcp | src/connectors
|               Tools: what the agent can do.                 |
|               Skills: how work should be done.              |
|               MCP: external tool providers.                 |
|               Connectors: external services.                |
+-------------------------------------------------------------+
| Platform      src/native (TypeScript wrappers)              |
|               Typed, testable boundary over Kotlin.         |
+-------------------------------------------------------------+
| Native        android/app/src/main/java/com/devour/app      |
|               Kotlin: filesystem, processes, PTY,           |
|               permissions, runtime hosts, background work.  |
+-------------------------------------------------------------+
| Runtime       Termux today, replaceable                     |
|               Executes commands in the real workspace.      |
+-------------------------------------------------------------+
```

### Import rules

| Layer | May import | Must never import |
| --- | --- | --- |
| UI | `src/agent` public API, `src/design`, `src/i18n`, `src/ui`, `src/lib` | model SDKs, `src/native/*` internals, runtime implementations |
| Agent runtime | capability interfaces, `src/lib` | React Native components, Termux-specific code |
| Tools / Skills / MCP / Connectors | `src/native` wrappers, `src/lib` | UI, each other's internals |
| `src/native` | `react-native` only | agent runtime, UI |
| `src/design` | `react-native` primitives only | screens, `src/i18n`, product logic |
| `src/i18n` | `react-native` primitives only | screens, `src/design`, product logic |
| Kotlin | Android APIs, React Native bridge | any product or UI logic |

A violation of this table is a bug, even if the feature works.

## Agent runtime (design, Phase 2+)

The runtime is the only component that talks to a model. It receives intents from the UI and
emits a stream of events the UI renders.

```ts
type AgentEvent =
  | {type: 'message.delta'; id: string; text: string}
  | {type: 'message.done'; id: string}
  | {type: 'tool.call'; call: ToolCall}
  | {type: 'tool.update'; id: string; status: ToolStatus; output?: string}
  | {type: 'permission.request'; request: PermissionRequest}
  | {type: 'changeset.updated'; changeset: ChangeSet}
  | {type: 'error'; message: string; recoverable: boolean};

interface ModelProvider {
  readonly id: string;
  stream(request: ModelRequest): AsyncIterable<ModelChunk>;
}
```

Swapping `ModelProvider` must never require a UI change. The UI subscribes to `AgentEvent`
and nothing else.

## Tools (design, Phase 5)

A tool is a declared capability with a schema, a permission class, and an executor.

```ts
interface ToolDefinition<Input, Output> {
  readonly name: string;           // shell, read_file, write_file, edit_file,
                                   // list_files, search_files, git, process
  readonly description: string;
  readonly input: Schema<Input>;
  readonly permission: PermissionClass;
  execute(input: Input, ctx: ToolContext): Promise<Output>;
}
```

Tools are registered in a registry; adding one must not require changes to the runtime core.
Every call moves through one state machine, which is also exactly what the UI renders:

```
pending -> running -> success
                   -> error
                   -> cancelled
```

## Skills (design, Phase 6)

Skills carry procedural knowledge. They are discovered, ranked and loaded progressively, not
concatenated into the prompt. The format and discovery rules live in
[SKILL-SYSTEM.md](SKILL-SYSTEM.md).

## MCP (design, Phase 7)

MCP is a separate layer from skills: it supplies *external tools*, which are adapted into the
same `ToolDefinition` shape the built-in tools use, so the runtime treats them identically.

```
McpServerConfig -> McpClient(transport) -> discovered tools -> ToolDefinition adapters
```

Transports are pluggable and follow the MCP specification; the subsystem owns server
lifecycle, tool discovery, invocation, error mapping and per-server permission state. No
single vendor's server is assumed.

## Connectors (design, Phase 8)

Connectors model external *services* (GitHub, GitLab, cloud storage), not tools: credentials,
account state, and service-specific operations. One real connector is built first; the
interface is what matters.

## Permissions (design, Phase 5+)

```ts
type PermissionClass =
  | 'read'            // never prompts
  | 'write_file'
  | 'shell'
  | 'destructive'     // rm, reset --hard, force push
  | 'network'
  | 'mcp_tool'
  | 'connector';

type PermissionDecision = 'allow_once' | 'allow_for_session' | 'deny';
```

Rules: read operations never prompt; `destructive` never inherits a session grant; every grant
is scoped to a workspace path; the prompt always shows the exact command and directory.

## Execution and runtime abstraction (design, Phase 4)

```ts
interface RuntimeHost {
  readonly id: string;                 // 'termux'
  probe(): Promise<RuntimeHostStatus>; // implemented in Phase 1
  exec(command: ExecRequest): Promise<ExecHandle>;
}
```

`Agent -> Execution API -> RuntimeHost -> Termux`. The agent never imports a Termux constant.
Phase 1 already implements the `probe` half of this contract in Kotlin, because knowing
whether a runtime host exists is a real, checkable fact rather than a placeholder.

## Native layer (implemented incrementally)

Kotlin owns Android reality. Today it exposes one module:

| Module | Name on the bridge | Responsibility |
| --- | --- | --- |
| `DevourEnvironmentModule` | `DevourEnvironment` | device, SDK, ABI, CPU and storage facts; runtime host detection via package visibility |

The module is registered through `DevourNativePackage`, a `BaseReactPackage` with lazy module
instantiation, which is the current React Native API for native modules on the new
architecture. A migration to a codegen TurboModule spec is scheduled for Phase 4, when the
native surface grows to processes and PTY.

JavaScript never touches `NativeModules` directly outside `src/native/`. The wrapper
normalises values and fails with a typed error when the bridge is missing, so a JS-only
development build degrades instead of crashing.

## Themes and language (implemented)

Both are presentation concerns, so they live in the UI layer and are decided once at the
composition root (`src/App.tsx`), never read from a global singleton inside a component.

```
App
  LanguageProvider   device locale -> Language -> Translator  (src/i18n)
    ThemeProvider    device scheme -> ThemeName -> Theme      (src/design)
      FoundationScreen
```

| Concern | Owner | Resolution order |
| --- | --- | --- |
| Theme | `src/design/ThemeProvider.tsx` | explicit choice, then `useColorScheme()`, then dark |
| Language | `src/i18n/LanguageProvider.tsx` | explicit choice, then device locale, then English |

The device locale is read once through React Native's `I18nManager` constants, which expose
Android's `Locale.toString()` value (`ru_RU`). The constant is optional and the module is
absent in a test renderer, so `src/i18n/device.ts` guards it and falls back instead of
throwing. `resolveLanguage` accepts `ru_RU`, `ru-RU`, `ru` and `ru_RU.UTF-8` alike.

Components read a `Theme` from context and a `Translator` from context; they never import a
palette or a string literal. Styles are built per theme with
`useMemo(() => createStyles(theme), [theme])`, which keeps `StyleSheet.create` out of the
render path while still allowing the palette to change at runtime.

Neither choice is persisted yet: there is no settings store before Phase 3, and a fake one
would be a lie. Both reset to the device default on restart, which is documented behaviour
rather than an oversight.

## Phase mapping

| Layer | Lands in |
| --- | --- |
| Native platform facts, UI shell, themes, localisation, CI | Phase 1 |
| Agent runtime, model abstraction | Phase 2 |
| Workspace state and filesystem | Phase 3 |
| Execution API and Termux runtime | Phase 4 |
| Tool registry and built-in tools | Phase 5 |
| Skill discovery and loading | Phase 6 |
| MCP subsystem | Phase 7 |
| Connector layer | Phase 8 |
| Agent UX: tool cards, permissions, diffs | Phase 9 |

## Decisions

| # | Decision | Reason |
| --- | --- | --- |
| 1 | React Native + TypeScript for UI, Kotlin for platform | native performance and real Android APIs without a WebView |
| 2 | New architecture and Hermes enabled | current React Native default; avoids a later migration |
| 3 | `BaseReactPackage` instead of `createNativeModules` | `createNativeModules` is deprecated in React Native 0.87 |
| 4 | Gradle wrapper JAR not committed | binary artefacts stay out of the repository; `scripts/bootstrap-gradle-wrapper.sh` and CI provision Gradle 9.4.1 |
| 5 | No committed debug keystore | debug builds use the Android Gradle Plugin's managed keystore |
| 6 | Release signing from environment variables | no secrets in the repository; unsigned APK when no keystore is provided |
| 7 | No dependency added without a working use | keeps the foundation small and the build fast |
| 8 | `debuggableVariants = []` in the app's `react` block | the plugin skips JS bundling for debuggable variants, so the debug APK shipped without `assets/index.android.bundle` and died at launch with "Unable to load script"; CI now fails if the bundle is missing from the APK |
| 9 | Semantic palettes per theme, no hex in components | a second theme costs nothing, and a component cannot accidentally become theme specific |
| 10 | Own i18n layer instead of a library | two languages need a typed dictionary and one plural rule; `Intl.PluralRules` is not guaranteed in Hermes, and a library would add weight without adding correctness |
