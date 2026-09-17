# Design language

Devour is an instrument, not an IDE. The interface should feel like a precise machine that is
working on your project, one thumb away, with nothing on screen that is not carrying meaning.

## Direction

- **Chassis, not canvas.** A cool near-black surface, hairline structure, no cards with
  shadows, no gradients. Content sits directly on the chassis.
- **Warm text on cool metal.** Text is a warm off-white; the surface is cool. That tension is
  the identity, and it costs nothing in performance.
- **One molten accent.** A single hot orange marks what the agent is doing *right now*, plus
  the one action the user is meant to take. Spending it anywhere else destroys it.
- **Machine data is monospaced.** Paths, commands, diff counts and device facts are mono
  because they are machine truth. Prose is never mono.
- **Progressive disclosure.** A tool call is one line until you open it. A diff is a count
  until you ask for the file list. A permission prompt shows the command, not a manual.

## Colour

| Token | Hex | Role |
| --- | --- | --- |
| `chassis` | `#101519` | app background |
| `surface` | `#171E24` | raised rows, sheets, tool cards |
| `edge` | `#25303A` | hairlines and dividers |
| `bone` | `#ECE7DF` | primary text |
| `muted` | `#8494A1` | labels, secondary text, inactive icons |
| `molten` | `#FF4A17` | active agent state, primary action, focus |
| `ok` | `#5FD3A3` | success, passing tests, clean status |
| `warn` | `#E8B34A` | attention, missing runtime, pending approval |
| `danger` | `#F2645A` | destructive actions and failures |

Rules: `molten` never fills a large area; `ok`, `warn` and `danger` appear as 6 px state dots
and short labels, never as banners; no colour is introduced outside this table.

## Typography

Two roles, one family each: the platform sans for interface text, the platform mono for
machine text.

| Role | Size / line height | Use |
| --- | --- | --- |
| `display` | 44 / 44, tight tracking | one number or word per screen, at most |
| `title` | 21 / 26 | screen or section identity |
| `body` | 15 / 22 | messages and prose |
| `label` | 12 / 16 | row labels, state text |
| `mono` | 13 / 18 | paths, commands, values, diff counts |

Prose lines stay under roughly 60 characters on a phone. No all-caps tracking-out labels, no
accenting a single word inside a sentence, no decorative arrows inside button text.

## Space and structure

A 4 px base scale: `4, 8, 12, 20, 32, 52`. Radii: `6` for rows, `10` for sheets, pill for
state chips. Structure comes from hairlines and alignment, not from boxes: one column, left
aligned, generous space above the content that matters.

Numbered markers are allowed only for real sequences - the roadmap phases are one, so Phase 1
prints a large `01`. Nothing else on that screen competes with it.

## Screens

### Phase 1 - Foundation status (implemented)

```
  devour                        0.1.0

  01
  Foundation

  Android          16 (API 36)
  Device           Google Pixel 8
  ABI              arm64-v8a
  CPU              8 cores
  Storage          41.2 GB free of 128 GB
  App files        /data/user/0/com.devour.app/files
  Runtime host   * Termux not installed
  ----------------------------------------
  native bridge connected
```

### Phase 2 - Chat (target)

```
  devour                            ...

  you
  Add Firebase auth to this project

  +----------------------------------+
  | agent                            |
  | Inspecting project               |
  |   package.json                   |
  |   src/                           |
  |   12 files read                  |
  +----------------------------------+

  ----------------------------------------
  Ask Devour...                        >
```

The composer is the only persistent chrome. The header is a wordmark and one overflow action.

### Permission prompt (target, Phase 5)

A bottom sheet, thumb-reachable, showing the command verbatim in mono, the directory, and
three actions in one row: `Allow once`, `Allow for session`, `Deny`. Destructive commands
replace the session option with a single `Allow once` in `danger`.

### File changes (target, Phase 9)

```
  4 files changed
  src/auth.ts      +21 -4
  src/api.ts        +8 -2
  package.json      +1
  README.md        +12

  View diff     Undo     Accept
```

Counts first, files second, the diff itself only on request. No desktop Git panel.

## Motion

Durations: `120 ms` for state changes, `200 ms` for entrances, `320 ms` for the one
orchestrated moment on a screen. Motion that the user did not trigger is limited to the
agent's activity indicator. Everything respects reduced-motion settings.

## Not this

- cream-and-terracotta AI landing pages, or near-black with an acid accent
- SaaS card kits, endless rounded rectangles, random gradients
- tracked-out all-caps eyebrows and `A - B - C` taglines
- a shrunken VS Code, a file manager, or a Material CRUD form
- imitating another assistant's chat interface

## Quality floor

Any screen that ships must: keep touch targets at 44 px or larger, reach all actions with one
thumb, provide accessible labels for icon-only controls, keep text contrast at 4.5:1 or
better, handle the keyboard without hiding the composer, and render an honest empty or error
state instead of a spinner that never resolves.
