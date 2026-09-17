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

| Layer                             | May import                                                            | Must never import                                             |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| UI                                | `src/agent` public API, `src/design`, `src/i18n`, `src/ui`, `src/lib` | model SDKs, `src/native/*` internals, runtime implementations |
| Agent runtime                     | `src/native` wrappers, capability interfaces, `src/lib`               | React Native components, Termux-specific code                 |
| Tools / Skills / MCP / Connectors | `src/native` wrappers, `src/lib`                                      | UI, each other's internals                                    |
| `src/native`                      | `react-native` only                                                   | agent runtime, UI                                             |
| `src/design`                      | `react-native` primitives only                                        | screens, `src/i18n`, product logic                            |
| `src/i18n`                        | `react-native` primitives only                                        | screens, `src/design`, product logic                          |
| Kotlin                            | Android APIs, React Native bridge                                     | any product or UI logic                                       |

A violation of this table is a bug, even if the feature works.

## Agent runtime (implemented in Phase 2; tool events still design)

The runtime is the only component that talks to a model. It receives intents from the UI and
turns model output into conversation state.

```
ChatScreen ---> AgentProvider ---> AgentSession ---> ModelProvider ---> endpoint
   ^                                    |
   |                                    +--> AgentEvent --> reduceConversation --> state
   +------------------------------ SessionState (conversation, status, failure, persistence)
```

`src/agent/types.ts` declares what Phase 2 emits, and nothing more:

```ts
type AgentEvent =
  | {type: 'message.add'; at: number; message: Message}
  | {type: 'message.delta'; at: number; id: string; text: string}
  | {type: 'message.done'; at: number; id: string}
  | {type: 'message.cancelled'; at: number; id: string}
  | {type: 'message.failed'; at: number; id: string}
  | {type: 'message.drop'; at: number; id: string};

interface ModelProvider {
  readonly id: string;
  stream(request: ModelRequest): AsyncIterable<ModelChunk>;
}
```

The events for tools, permissions, change sets and recoverable errors stay **design** until
the phases that emit them (5, 9). Declaring them now would mean shipping a type nobody
produces and a renderer branch nobody reaches.

Three properties hold by construction rather than by convention:

- **Conversation state is a pure function of the event stream.** `reduceConversation` has no
  effects, so rotation, restart and a replayed stream all produce the same conversation, and
  the reducer is tested without a renderer or a network.
- **Cancellation is part of the provider contract.** `ModelRequest.signal` is an
  `AbortSignal`; the transport aborts the request, the provider throws `StreamCancelledError`,
  and the session marks the turn `cancelled` instead of discarding what already arrived.
- **A failure is a value.** Every reason a request can fail maps to one `AgentErrorCode`
  (`provider.unconfigured`, `provider.unauthorized`, `provider.http`, `provider.network`,
  `provider.response`), and the screen renders the code plus the endpoint's own words. No
  `catch` in this project swallows an error to keep the UI tidy.

Swapping `ModelProvider` requires no UI change: the screen reads `SessionState` and never
learns which endpoint produced it. Adding a second provider kind is one file in
`src/agent/providers/` and one line in `createProvider`.

## Tools (design, Phase 5)

A tool is a declared capability with a schema, a permission class, and an executor.

```ts
interface ToolDefinition<Input, Output> {
  readonly name: string; // shell, read_file, write_file, edit_file,
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

MCP is a separate layer from skills: it supplies _external tools_, which are adapted into the
same `ToolDefinition` shape the built-in tools use, so the runtime treats them identically.

```
McpServerConfig -> McpClient(transport) -> discovered tools -> ToolDefinition adapters
```

Transports are pluggable and follow the MCP specification; the subsystem owns server
lifecycle, tool discovery, invocation, error mapping and per-server permission state. No
single vendor's server is assumed.

## Connectors (design, Phase 8)

Connectors model external _services_ (GitHub, GitLab, cloud storage), not tools: credentials,
account state, and service-specific operations. One real connector is built first; the
interface is what matters.

## Permissions (design, Phase 5+)

```ts
type PermissionClass =
  | 'read' // never prompts
  | 'write_file'
  | 'shell'
  | 'destructive' // rm, reset --hard, force push
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
  readonly id: string; // 'termux'
  probe(): Promise<RuntimeHostStatus>; // implemented in Phase 1
  exec(command: ExecRequest): Promise<ExecHandle>;
}
```

`Agent -> Execution API -> RuntimeHost -> Termux`. The agent never imports a Termux constant.
Phase 1 already implements the `probe` half of this contract in Kotlin, because knowing
whether a runtime host exists is a real, checkable fact rather than a placeholder.

## Native layer (implemented incrementally)

Kotlin owns Android reality. Today it exposes three modules:

| Module                    | Name on the bridge  | Responsibility                                                                         |
| ------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `DevourEnvironmentModule` | `DevourEnvironment` | device, SDK, ABI, CPU and storage facts; runtime host detection via package visibility |
| `DevourStorageModule`     | `DevourStorage`     | named JSON documents in `filesDir/documents`, written to a temporary file and renamed  |
| `DevourSecretsModule`     | `DevourSecrets`     | AES/GCM values under a non-extractable AndroidKeyStore key, kept in private prefs      |

Modules are registered through `DevourNativePackage`, a `BaseReactPackage` with lazy module
instantiation, which is the current React Native API for native modules on the new
architecture. A migration to codegen TurboModule specs is scheduled for Phase 4, when the
native surface grows to processes and PTY.

JavaScript never touches `NativeModules` directly outside `src/native/`: `bridge.ts` is the
single place that reads it, and a module missing from the running binary produces
`NativeBridgeUnavailableError` rather than a `TypeError` inside a screen. That is what lets a
JavaScript-only build degrade honestly - the chat still runs, and says "history is not being
saved" instead of pretending to persist.

Document names and secret keys are validated (`^[a-z0-9][a-z0-9._-]{0,63}$`) so a caller
cannot address anything outside the one directory. Writes are atomic by rename, so a process
killed mid-write leaves the previous document readable rather than a truncated one. A secret
blob that no longer decrypts - the keystore key was replaced with the lock screen, or the
entry was restored from another device - is dropped and reported as "no secret stored", which
is the only state the caller can act on.

## Themes and language (implemented)

Both are presentation concerns, so they live in the UI layer and are decided once at the
composition root (`src/App.tsx`), never read from a global singleton inside a component.

```
App
  SafeAreaProvider     window insets                          (react-native-safe-area-context)
    LanguageProvider   device locale -> Language -> Translator (src/i18n)
      ThemeProvider    device scheme -> ThemeName -> Theme     (src/design)
        AgentProvider  one AgentSession for the process        (src/agent)
          RootScreen   ChatScreen | SystemScreen
```

| Concern  | Owner                           | Resolution order                                    |
| -------- | ------------------------------- | --------------------------------------------------- |
| Theme    | `src/design/ThemeProvider.tsx`  | explicit choice, then `useColorScheme()`, then dark |
| Language | `src/i18n/LanguageProvider.tsx` | explicit choice, then device locale, then English   |

The device locale is read once through React Native's `I18nManager` constants, which expose
Android's `Locale.toString()` value (`ru_RU`). The constant is optional and the module is
absent in a test renderer, so `src/i18n/device.ts` guards it and falls back instead of
throwing. `resolveLanguage` accepts `ru_RU`, `ru-RU`, `ru` and `ru_RU.UTF-8` alike.

Components read a `Theme` from context and a `Translator` from context; they never import a
palette or a string literal. Styles are built per theme with
`useMemo(() => createStyles(theme), [theme])`, which keeps `StyleSheet.create` out of the
render path while still allowing the palette to change at runtime.

Neither choice is persisted yet. The document store arrived in Phase 2 for the conversation,
so the blocker is no longer missing storage but the preference documents and their hydration,
which Phase 3 owns together with the rest of the settings. Both choices reset to the device
default on restart, which is documented behaviour rather than an oversight.

## Conversation persistence (implemented in Phase 2)

One conversation lives in one document, `conversation.json`, written after every turn that
changes it and read once at startup. The session keeps the last 200 turns; a phone is not an
archive, and an unbounded document would eventually stall the startup read.

Restoring is not the same as resuming. A process killed mid-stream leaves a turn marked
`streaming`, which was true when it was written and is false now, so `settleRestoredConversation`
marks it `cancelled` on load: a spinner that never finishes would be the exact kind of lie
this project refuses. A document that cannot be parsed - truncated, or written by an older
build - is discarded rather than patched, and the screen says history is not being saved.

The API key is not part of that document. It lives in `DevourSecrets`, is read once into a
ref inside `AgentProvider`, and never enters React state, a log line or a rendered string;
only its presence is exposed to the interface.

## Phase mapping

| Layer                                                     | Lands in |
| --------------------------------------------------------- | -------- |
| Native platform facts, UI shell, themes, localisation, CI | Phase 1  |
| Agent runtime, model abstraction                          | Phase 2  |
| Workspace state and filesystem                            | Phase 3  |
| Execution API and Termux runtime                          | Phase 4  |
| Tool registry and built-in tools                          | Phase 5  |
| Skill discovery and loading                               | Phase 6  |
| MCP subsystem                                             | Phase 7  |
| Connector layer                                           | Phase 8  |
| Agent UX: tool cards, permissions, diffs                  | Phase 9  |

## Decisions

| #   | Decision                                              | Reason                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | React Native + TypeScript for UI, Kotlin for platform | native performance and real Android APIs without a WebView                                                                                                                                                               |
| 2   | New architecture and Hermes enabled                   | current React Native default; avoids a later migration                                                                                                                                                                   |
| 3   | `BaseReactPackage` instead of `createNativeModules`   | `createNativeModules` is deprecated in React Native 0.87                                                                                                                                                                 |
| 4   | Gradle wrapper JAR not committed                      | binary artefacts stay out of the repository; `scripts/bootstrap-gradle-wrapper.sh` and CI provision Gradle 9.4.1                                                                                                         |
| 5   | No committed debug keystore                           | debug builds use the Android Gradle Plugin's managed keystore                                                                                                                                                            |
| 6   | Release signing from environment variables            | no secrets in the repository; unsigned APK when no keystore is provided                                                                                                                                                  |
| 7   | No dependency added without a working use             | keeps the foundation small and the build fast                                                                                                                                                                            |
| 8   | `debuggableVariants = []` in the app's `react` block  | the plugin skips JS bundling for debuggable variants, so the debug APK shipped without `assets/index.android.bundle` and died at launch with "Unable to load script"; CI now fails if the bundle is missing from the APK |
| 9   | Semantic palettes per theme, no hex in components     | a second theme costs nothing, and a component cannot accidentally become theme specific                                                                                                                                  |
| 10  | Own i18n layer instead of a library                   | two languages need a typed dictionary and one plural rule; `Intl.PluralRules` is not guaranteed in Hermes, and a library would add weight without adding correctness                                                     |
| 11  | Prettier is a formatter, not an ESLint rule           | `@react-native/eslint-config` 0.87 ships no `eslint-plugin-prettier`, so a `prettier/prettier` rule fails the run; `npm run format:check` is a separate CI step instead                                                  |
| 12  | Streaming over `XMLHttpRequest`, not `fetch`          | React Native's `fetch` resolves only when the body is complete and exposes no reader, so a streamed answer would arrive in one lump; XHR's `readyState === LOADING` plus `responseText` is the only streaming path in RN |
| 13  | Own document store in Kotlin, not `AsyncStorage`      | Kotlin already owns the filesystem, the conversation is one document rather than a key-value map, and an atomic rename is something a dependency could not give us                                                       |
| 14  | Secrets in the AndroidKeyStore, not in a document     | an API key in `filesDir` is readable by anything that reads the backup or the device; the keystore key is non-extractable, so the stored blob is useless when copied off the phone                                       |
| 15  | No navigation library for two screens                 | a router, a gesture handler and a stack are weight for a switch between two surfaces; `RootScreen` holds the choice and Phase 3 revisits it when the workspace screen arrives                                            |
| 16  | `react-native-safe-area-context` added in Phase 2     | the chat reaches the top and bottom edges, and edge-to-edge is enabled; `useSafeAreaInsets` is the supported way to read the real insets, and the library ships the jest mock the tests use                              |
| 17  | The system prompt states the build has no tools       | the model is told exactly what it can do, so it stops promising to read files it cannot reach; the prompt grows in the phase that gives it a capability                                                                  |
