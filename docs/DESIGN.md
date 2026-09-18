# Design language

Devour is an instrument, not an IDE. The interface should feel like a precise machine working
on your project, one thumb away, with nothing on screen that is not carrying meaning.

## Direction

- **Black and white, and the greys between them.** Not one hue anywhere. A monochrome
  interface has nothing to hide behind: hierarchy has to come from contrast, weight, size and
  position, which is the hierarchy that survives sunlight, cheap panels and colour blindness.
- **Maximum contrast is the accent.** Where another product would reach for a brand colour,
  Devour inverts: white on black, black on white. It is the loudest thing available and it is
  spent on one element per screen - Send, Save, a failure.
- **True black, paper white.** The dark theme is `#000000`, which on the OLED panels Devour
  runs on is the screen being off. The light theme is paper with ink. They are mirrors, not
  inversions of one set of greys: perceived contrast is not symmetric.
- **State is said, not coloured.** What a red or amber dot usually carries - failed, busy,
  degraded - is carried here by words, by an inverted strip, or by a caret that is pulsing.
  Nothing on screen depends on a user telling two hues apart.
- **Machine data is monospaced.** Paths, commands, endpoints, code and device facts are mono
  because they are machine truth. Prose is never mono, and mono is never used as decoration.
- **Progressive disclosure.** A tool call is one line until you open it. A diff is a count
  until you ask for the file list. A permission prompt shows the command, not a manual.

Why the rewrite: the first palette was a warm cream with a terracotta accent, which is the
single most common signature of a generated interface - the kind of screen that looks
designed in a thumbnail and looks like a template in the hand. Monochrome is not a retreat
from that; it is a harder constraint, and the constraint is the point.

## Colour

Colour is declared as semantic roles, once per theme, in `src/design/theme.ts`. A component
asks for a role and never for a hex value; that is what makes a second theme free.

| Token           | Dark      | Light     | Role                                             |
| --------------- | --------- | --------- | ------------------------------------------------ |
| `background`    | `#141414` | `#FAFAFA` | the page itself                                  |
| `surface`       | `#1F1F1F` | `#F0F0F0` | a raised block: a listing, a field               |
| `surfaceStrong` | `#2B2B2B` | `#E4E4E4` | your own words, and a block that is pressed      |
| `edge`          | `#3A3A3A` | `#D4D4D4` | hairlines and outlines                           |
| `text`          | `#E8E8E8` | `#1A1A1A` | primary text                                     |
| `muted`         | `#ABABAB` | `#4F4F4F` | labels, values, anything supporting              |
| `faint`         | `#949494` | `#626262` | placeholders and disabled states, still readable |
| `inverse`       | `#E8E8E8` | `#1A1A1A` | the maximum contrast fill                        |
| `onInverse`     | `#141414` | `#FAFAFA` | text and glyphs sitting on `inverse`             |

**Neither extreme is used.** The first monochrome pass was `#FFFFFF` on `#000000`, which is
21:1 - the most a screen can do. On a phone that is not the best case, it is glare: white
letters bleed into true black on an OLED panel, and the author's verdict after reading one
long answer on hardware was that it tears your eyes. The page is now `#141414`, primary text
is `#E8E8E8`, and the pair lands at about 15:1 - still far past the 7:1 that the strictest
accessibility level asks for, and readable for an hour. The light theme is off its extremes
for the same reason: a backlight behind `#FFFFFF` is a lamp pointed at the reader.

Rules: every value is a grey, enforced by a test that reads the hex channels; every text role
clears 4.5:1 against `background`, `surface` and `surfaceStrong`, computed from the WCAG
formula in `__tests__/theme.test.ts` rather than asserted by eye; primary text stays inside a
measured window - past 12:1, short of 19:1 - so neither the glare nor a washed-out grey can
come back; `#000000` and `#FFFFFF` appear nowhere, also by test; both themes carry every
token, so a component cannot be theme specific; no component contains a hex value.

The theme follows the device by default. `system`, `dark` and `light` are the three choices,
and the dark theme is the fallback when the device reports nothing.

## Typography

Two families: the platform sans for interface text, the platform mono for machine text.
Labels are sentence case. Tracked-out capitals are a template habit that also costs
legibility, and they appear nowhere.

| Role      | Size / line height      | Use                                     |
| --------- | ----------------------- | --------------------------------------- |
| `display` | 32 / 38, tight tracking | one statement per screen, at most       |
| `title`   | 22 / 28                 | screen title, section title, wordmark   |
| `heading` | 17 / 22                 | a heading inside an answer              |
| `body`    | 16 / 24                 | prose, answers, explanations            |
| `label`   | 14 / 18                 | buttons, segment labels                 |
| `caption` | 12 / 16                 | field labels, row labels, quiet notes   |
| `mono`    | 13 / 20                 | paths, commands, endpoints, code, facts |

Rules: one `display` element per screen at most; prose is never mono; machine data is never
sans; body text never drops below 16, because this is a phone.

The device's own font scale is obeyed for prose without a ceiling - someone who set their
phone to the largest text wants the largest text, and a paragraph reflows. `mono` and
`display` are capped at `MAX_FONT_SCALE` (1.2): code scrolls sideways instead of reflowing,
so at 1.6x a listing becomes a column of three words, and a 32 dp statement at 1.6x pushes
the screen it introduces out of view. Found on a real device with a large system font, not in
a simulator.

## Space, shape and touch

A four pixel base scale (`space` in `src/design/tokens.ts`): 4, 8, 12, 16, 24, 40, 64.
Sections are separated by space and weight rather than by rules and cards - a data row is a
bottom hairline, not a box.

Three radii, not one: `control` 12 for buttons, fields and inverted strips, `block` 20 for the
raised block the user's own words sit in, `pill` for anything circular. One radius on
everything is a tell; so is a hairline around everything.

Nothing interactive is smaller than 44 px (`TOUCH_TARGET`), and primary actions sit in the
lower half of the screen where a thumb reaches.

## Icons

Seven icons, drawn as vectors in `src/ui/Icon.tsx`: `send`, `stop`, `newest`, `copy`,
`check`, `again`, `next`. Nothing else is drawn as an icon, and an icon with no caller is
deleted rather than kept for later.

They are geometry, not characters. The first build used `\u2191` for send and `\u203a` for a
row that opens; on the author's phone the send button rendered as two empty boxes, because
the font that device ships with has no such glyph. A control whose meaning depends on an
unknown font is a control that can break on a device nobody tested, so nothing user facing
may be a text glyph. An icon font is not the answer either: a licensed binary with its own
metrics, loaded before the first frame, to draw seven shapes.

| Rule           | Value                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------- |
| Grid           | 24 units, 2 units of margin                                                                   |
| Sizes          | 16 inside a caption, 20 in a row or a pill, 24 in a round control                             |
| Stroke         | 1.75 at 24, 1.9 at 20, 2.1 at 16 - the small sizes are drawn heavier so the weight reads even |
| Caps and joins | round, everywhere                                                                             |
| Fill           | none, except `stop`: a stop is a solid, because the thing that was moving ends here           |
| Colour         | a palette text role (`text`, `muted`, `faint`, `onInverse`), never a hex value                |

An icon is hidden from screen readers; the control it sits in carries the label.

## Motion

One personality for the whole application: quick, and smooth rather than firm - no bounce, no
overshoot. Bounce belongs to a different product. Everything is `Animated` with the native
driver, so transform and opacity run off the JavaScript thread; the hooks live in
`src/design/motion.ts`.

| Token       | Value                | Use                                                          |
| ----------- | -------------------- | ------------------------------------------------------------ |
| `instant`   | 90 ms                | press feedback                                               |
| `quick`     | 160 ms               | a control changing state, an icon swap, an exit              |
| `standard`  | 260 ms               | something arriving                                           |
| `slow`      | 400 ms               | a whole surface changing                                     |
| `pulse`     | 1040 ms              | one breath of the caret                                      |
| `ghost`     | 1400 ms              | one pass of the wave over the placeholder lines              |
| `glide`     | `(0.22, 1, 0.36, 1)` | most things: leaves at once, spends its second half settling |
| `signature` | `(0.2, 0, 0, 1)`     | a control answering a press: firmer, same character          |
| `exit`      | `(0.3, 0, 1, 1)`     | exits: accelerate, do not be watched                         |
| `ambient`   | `(0.4, 0, 0.6, 1)`   | anything that loops                                          |

Rules:

- One entrance pattern: rise 14 px and fade on `glide`. Everything that arrives uses it.
- Smooth is a curve, not a duration. The first pass ran 240 ms on a curve that lands hard,
  which reads as a jump; the numbers above are the ceiling of what still feels immediate on a
  phone, and the curve is what does the work.
- Two scales and no more: a press goes to 0.97, something appearing in place starts at 0.92.
- Entrances are longer than exits. What leaves should not ask to be watched.
- Motion is never the only carrier of information: every animation has a still state that
  says the same thing, which is what makes "reduce motion" a branch rather than a redesign.
- A stagger is 70 ms and the whole cascade ends inside 500 ms.
- Two things loop, both of them saying the machine is working: the caret at the end of an
  arriving answer, and the wave over the placeholder lines before the first token. Every loop
  is slower than any transition - a loop that keeps pace with a press reads as impatience.
- `useReducedMotion` follows the Android animator scale; with motion reduced, animations
  resolve to their final state instead of being skipped, and both loops hold still at a fixed
  opacity.

## Language

Devour speaks English and Russian, and the device decides which one without being asked.

- Resolution order: the user's explicit choice, then the device locale, then English. The
  device locale comes from React Native's `I18nManager` constants, which report Android's
  `Locale.toString()` value such as `ru_RU`.
- Every visible string comes from the dictionary in `src/i18n/messages.ts`. The dictionary is
  typed as a complete record per language, so a missing translation fails the typecheck
  instead of leaking an English word onto a Russian screen. A key the interface no longer
  shows fails the test suite, so dead strings cannot accumulate.
- The unit of translation is a whole sentence with placeholders, never a fragment: word order
  differs, so `{free} free of {total}` and `{free} свободно из {total}` are separate strings.
- Russian needs three plural forms (1 ядро, 2 ядра, 5 ядер). Counted nouns therefore go
  through `plural()`, never through string concatenation.
- Machine data stays in its machine form in both languages: paths, ABIs, `arm64-v8a`, byte
  units, package names, brand names such as OpenRouter, the `devour` wordmark.
- Russian text runs roughly 15-30% longer than English. Label columns are sized for the
  longer language, no layout depends on a fixed character count, and no string is truncated
  to make a row fit.

## The chat is the interface

The conversation is the product surface. What ships today:

```
  devour                              New  Settings
  gpt-4o-mini
  --------------------------------------------------

                        ______________________________
                       | Add Firebase authentication  |
                        ------------------------------

  Here is what I would change:

  +------------------------------------------------+
  | gradle                                  Copy   |
  | dependencies {                                 |
  |   implementation(platform("com.google..."))    |
  | }                                              |
  +------------------------------------------------+

  and then sync the project.|

   [copy] Copy   [again] Again
                          ( v )

  ( Describe a task                         ) ( ^ )
```

The three round shapes in that sketch are drawn icons, not characters: `send`, `stop` and
`newest` come out of `src/ui/Icon.tsx`.

- The header says where you are and what it is pointed at: the wordmark, and under it the
  model in use or `no model configured`. Header actions are text, never filled buttons - the
  one filled control on this screen is the one that sends.
- Two shapes, not two bubbles: the user's words sit in a raised block, right aligned, at most
  86% wide, with one corner tightened; the agent's answer sits directly on the page at full
  width. No tails, no avatars, no name labels - the shape says who spoke, and prose reads
  better full width.
- Between sending and the first token there are three placeholder bars where the lines will
  be, with a slow wave running down them. A status line saying "waiting for the model" was
  what shipped first, and it told the reader nothing about where the answer would appear.
  The bars carry no letters, so they cannot be mistaken for content, and they are replaced by
  the real text the moment it exists.
- From the first token on, a block caret pulses at the end of the text. That is the entire
  streaming indicator: it is where the eye already is, it needs no row of its own, and it
  cannot be mistaken for a decorative spinner. The still state is the caret being visible.
- Code is monospace on a raised block, with the language the model named and a copy action in
  its header. Copying says `Copied` only after the clipboard has actually taken the text - and
  swaps the copy icon for a tick, which is the answer to a press that otherwise changes
  nothing on screen - and the action is absent entirely in a build whose native module is
  missing.
- A finished listing longer than 14 lines is folded, and the button that opens it counts what
  is hidden: `Show all 37 lines`. A model asked for a file answers with two hundred lines, and
  unfolded that is three screens of scrolling between one sentence and the next. A listing
  that is still arriving is never folded: the reader is watching it be written.
- Fences are trimmed of the blank lines models pad them with. Rendered literally they leave a
  gap under the block's header that reads as a broken layout; blank lines inside the listing
  are the author's and stay.
- Under the last answer: `Copy` and `Again`. `Again` replaces the answer rather than adding a
  second one - a branching conversation is a Phase 2.3 feature, not a side effect.
- A stopped turn keeps the text that arrived and says it was stopped. A truncated answer with
  no explanation looks like a bug.
- The page follows the stream only while the reader is already at the bottom. Scrolling up to
  re-read is a decision; the pill is the way back, and it fades out when there is nowhere to
  go.
- A failure is an inverted strip - black on white in the dark theme - carrying what the
  endpoint said and the one action that answers it: `Retry`, or `Configure the model`. A
  limitation the user cannot fix now, such as history not being saved, is an outlined strip
  instead.
- The composer is one rounded field and one round control. The control does not move between
  states: while a stream runs, the same circle stops it. It is filled when it has something
  to do and outlined when it does not, and the icon scales in on either change. The field's
  outline brightens while it holds the keyboard, because a 2 px caret is otherwise the only
  sign of which control is focused. The field keeps taking text during a stream, because
  typing the next question while reading is normal.
- An empty conversation is not dressed up as a greeting. It is one large statement - `Ask
anything.` or `Point it at a model.` - one sentence of what this build can and cannot do,
  and, when nothing is configured, the button that fixes it. It sits at the bottom, next to
  the composer it is talking about, not floating in the middle of the screen.

Tool cards, permission sheets and diffs are Phases 5 and 9 and are **not** pre-drawn.

## What the settings screen shows

Four sections, in the order they matter on a phone that has just been installed: what answers,
how the interface behaves, what is stored, and what the device is.

```
  Настройки                                   Чат
  версия 0.1.0
  --------------------------------------------------

  Модель
  Любой эндпоинт с протоколом чата OpenAI...

  ( OpenAI ) ( OpenRouter ) ( Groq ) ( Localhost )

  Эндпоинт
  [ https://api.openai.com/v1                     ]
  Название модели
  [ gpt-4o-mini                                   ]
  API-ключ
  [ хранится в Android Keystore                   ]
  оставь пустым, чтобы сохранить текущий ключ

  [ Сохранить ]  ( Удалить ключ )

  Интерфейс
  Тема
  [  Авто  ][ Тёмная ][ Светлая ]
  Язык
  [  Авто  ][   EN   ][   RU   ]

  Данные
  Переписка хранится на этом устройстве и больше нигде.
  Очистить переписку                                ›

  Окружение
  Android        16 (API 36)
  Устройство     Google Pixel 8
  ABI            arm64-v8a
  CPU            8 ядер
  Память         41.2 GB свободно из 128 GB
  Файлы          /data/user/0/com.devour.app/files
  Runtime        termux не установлен
  Мост           нативный мост подключён
```

- The presets fill both fields in one tap. Typing `https://openrouter.ai/api/v1` on a phone
  keyboard is the worst moment in setting Devour up, and a typo in it looks exactly like a
  network failure. None of them is a default: an unconfigured Devour stays unconfigured,
  because a conversation must not leave for an endpoint the user did not choose.
- The form names the field that is wrong - "the endpoint must be an http or https address" -
  rather than saying "invalid input". A rejected field doubles its outline instead of turning
  red.
- The API key field is write-only: a stored key is reported as stored, in the keystore, and is
  never rendered back. Leaving it empty keeps the key that is there, which is the only
  behaviour that lets the model name change without retyping a secret on a phone keyboard.
- The device facts carry no state dots. "termux not installed" is clearer than amber, and the
  bridge row says in words whether Kotlin answered.
- There is no empty file tree and no placeholder terminal, because neither exists yet. Both
  screens tell the truth about what the build can do.

## Not doing

- a VS Code clone, a file tree as the primary surface, or desktop panel layouts
- Material component defaults, elevation stacks, or CRUD forms
- endless cards, random gradients, glassmorphism, emoji as iconography
- a copy of Claude or ChatGPT's chat UI, and no imitation of Anthropic's own product design
- the signatures of a generated interface: a cream-and-terracotta palette, tracked-out
  capitals, decorative numbered markers, mono micro-labels on prose, one radius everywhere, a
  centred grey empty state, an arrow inside button text
- decorative empty states that explain nothing

## Quality floor

Every screen that ships must satisfy all of these:

- reads correctly in both themes, and nothing on it depends on a hue
- every text role clears 4.5:1 on every surface it can sit on, checked by test
- every visible string comes from the dictionary, and both languages render without clipping
- one-handed: primary actions sit in the lower half; touch targets are at least 44 px
- no component contains a hex colour, a hard-coded spacing number, or an English string
- no icon, affordance or state is a text character: a glyph the device's font lacks renders as
  an empty box, and that has already happened on hardware
- interactive elements declare `accessibilityRole` and their state, abbreviations such as `RU`
  carry a spoken label, and an element that is invisible is also hidden from a screen reader
- every animation has a still state that carries the same information, and reduced motion is
  respected
- loading, empty, error and permission-denied states are designed, not improvised
- nothing on screen claims a capability the build does not have
