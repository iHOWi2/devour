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
carry every token, so a component cannot be theme specific.

The theme follows the device by default. `system`, `dark` and `light` are the three choices,
and the dark theme is the fallback when the device reports nothing.

## Typography

Two roles, one family each: the platform sans for interface text, the platform mono for
machine text.

| Role | Size / line height | Use |
| --- | --- | --- |
| `display` | 44 / 44, tight tracking | one number or word per screen, at most |
| `title` | 21 / 26 |