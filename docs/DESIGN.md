# Design language

Devour is an instrument, not an IDE. The interface should feel like a precise machine that is
working on your project, one thumb away, with nothing on screen that is not carrying meaning.

## Direction

- **Chassis, not canvas.** A cool near-black surface, hairline structure, no cards with
  shadows, no gradients. Content sits directly on the chassis.
- **Warm text on cool metal.** Text is a warm off-white; the surface is cool. That tension is
  the identity, and it costs nothing in performance.
- **Two themes, one instrument.** The light theme mirrors the same tension - cool ink on warm
  paper - instead of inverting lightness, which is how light themes end up grey and lifeless.
- **One molten accent.** A single hot orange marks what the agent is doing *right now*, plus
  the one action the user is meant to take. Spending it anywhere else destroys it.
- **Machine data is monospaced.** Paths, commands, diff counts and device facts are mono
  because they are machine truth. Prose is never mono.
- **Progressive disclosure.** A tool call is one line until you open it. A diff is a count
  until you ask for the file list. A permission prompt shows the command, not a manual.

## Colour

Colour is declared as semantic roles, once per theme, in `src/design/theme.ts`. A component
asks for a role and never for a hex value; that is what makes a second theme free.

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `background` | `#101519` | `#F4F1EC` | app background |
| `surface` | `#171E24` | `#FBF9F6` | raised rows, sheets, tool cards, selected segments |
| `edge` | `#25303A` | `#D8D1C6` | hairlines and dividers |
| `text` | `#ECE7DF` | `#14181B` | primary text |
| `muted` | `#8494A1` | `#5E6976` | labels, secondary text, inactive icons |
| `accent` | `#FF4A17` | `#D53A0E` | active agent state, primary action, focus |
| `onAccent` | `#101519` | `#FBF9F6` | text on an accent fill |
| `ok` | `#5FD3A3` | `#0F7A55` | success, passing tests, clean status |
| `warn` | `#E8B34A` | `#8A5D00` | attention, missing runtime, pending approval |
| `danger` | `#F2645A` | `#B32D22` | destructive actions and failures |

Rules: `accent` never fills a large area; `ok`, `warn` and `danger` appear as 6 px state dots
and short labels, never as banners; no colour is introduced outside this table; both themes
carry every token, so a component cannot be theme specific. The light accent and state
colours are darkened deliberately - the dark theme's values do not hold contrast on paper.

The theme follows the device by default. `system`, `dark` and `light` are the three choices,
and the dark theme is the fallback when the device reports nothing.

## Typography

Two families: the platform sans for interface text, the platform mono for machine text.

| Role | Size / line height | Use |
| --- | --- | --- |
| `display` | 44 / 44, tight tracking | one number or word per screen, at most |
| `title` | 21 / 26 | screen subject, wordmark, error titles |
| `body` | 15 / 22 | prose, agent messages, explanations |
| `label` | 12 / 16, slight tracking | row labels, segment labels, metadata |
| `mono` | 13 / 18 | paths, commands, versions, device facts |

Rules: one `display` element per screen at most; prose is never mono; machine data is never
sans; nothing smaller than `label`.

## Space and rhythm

A four pixel base scale (`space` in `src/design/tokens.ts`): 4, 8, 12, 20, 32, 52. Structure
comes from hairlines and space, not from boxes: a data row is a bottom hairline, not a card.
The screen breathes at the top and stays dense where the machine data is.

## Motion

Milliseconds, from `motion`: `state` 120 for a state change, `entrance` 200 for content
arriving, `orchestrated` 320 for the one moment a screen is allowed to have. No looping
animations, no decorative spinners where a real status line can be shown instead.

## Language

Devour speaks English and Russian, and the device decides which one without being asked.

- Resolution order: the user's explicit choice, then the device locale, then English. The
  device locale comes from React Native's `I18nManager` constants, which report Android's
  `Locale.toString()` value such as `ru_RU`.
- Every visible string comes from the dictionary in `src/i18n/messages.ts`. The dictionary is
  typed as a complete record per language, so a missing translation fails the typecheck
  instead of leaking an English word onto a Russian screen.
- The unit of translation is a whole sentence with placeholders, never a fragment: word order
  differs, so `{free} free of {total}` and `{free} свободно из {total}` are separate strings.
- Russian needs three plural forms (1 ядро, 2 ядра, 5 ядер). Counted nouns therefore go
  through `plural()`, never through string concatenation.
- Machine data stays in its machine form in both languages: paths, ABIs, `arm64-v8a`, byte
  units, package names, the `devour` wordmark.
- Russian text runs roughly 15-30% longer than English. Label columns are sized for the
  longer language, no layout depends on a fixed character count, and no string is truncated
  to make a row fit.

## The chat is the interface (Phase 2+)

When the agent runtime exists, the screen is a conversation: user turns, agent prose, and
collapsed tool cards in the flow. A tool call renders as one line with its state; opening it
reveals the command and output. File changes render as a count with a file list behind it.
Permission prompts are inline, show the exact command, and offer allow once, allow for
session, or deny. No composer is drawn before there is something to send it to.

## What the Phase 1 screen shows

Only facts that are real, in the device's language:

```
  devour                                0.1.0

  01
  Фундамент

  Android        16 (API 36)
  Устройство     Google Pixel 8
  ABI            arm64-v8a
  CPU            8 ядер
  Память         41.2 GB свободно из 128 GB
  Файлы          /data/user/0/com.devour.app/files
  Runtime      • termux не установлен
  ------------------------------------------
  нативный мост подключён        Настройки
```

The settings row is the only control, and it is collapsed until asked for - persistent chrome
has to earn its space:

```
  ------------------------------------------
  Тема
  [  Авто  ][ Тёмная ][ Светлая ]
  Язык
  [  Авто  ][   EN   ][   RU   ]
  ------------------------------------------
  нативный мост подключён        Настройки
```

There is no fake chat input, no empty file tree and no placeholder terminal, because none of
those exist yet. The screen tells the truth about what the build can do.

## Not doing

- a VS Code clone, a file tree as the primary surface, or desktop panel layouts
- Material component defaults, elevation stacks, or CRUD forms
- endless cards, random gradients, glassmorphism, emoji as iconography
- a copy of Claude or ChatGPT's chat UI, and no imitation of Anthropic's own product design
- decorative empty states that explain nothing

## Quality floor

Every screen that ships must satisfy all of these:

- reads correctly in both themes, including state colours and text on accent fills
- every visible string comes from the dictionary, and both languages render without clipping
- one-handed: primary actions sit in the lower half; touch targets are at least 44 px
- no component contains a hex colour, a hard-coded spacing number, or an English string
- interactive elements declare `accessibilityRole` and their state, and abbreviations such as
  `RU` carry a spoken label
- text contrast is at least 4.5:1 for body text in both themes
- loading, empty, error and permission-denied states are designed, not improvised
- nothing on screen claims a capability the build does not have
