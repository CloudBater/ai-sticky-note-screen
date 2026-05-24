# MarketMage ¡X Design Specification

> Single source of truth for the MarketMage redesign.
> Voice: restrained, editorial, trustworthy. Inspired by Linear, Stripe Docs, and financial publications. Dark-first.
>
> All values are normative. Do not improvise spacing, colors, or font sizes outside of this document. If something is missing, ask before inventing.

---

## 1. Design Principles

These principles override individual decisions when there's a conflict.

1. **Data is the protagonist.** Numbers, dates, and rates are the largest, most legible thing on screen. Chrome (cards, buttons, nav) defers to them.
2. **Restraint over flourish.** No gradients on text. No glow. No neon. One accent color, used sparingly. Generous whitespace.
3. **Disclaimers have posture.** Compliance copy is not minimized; it's presented with dignity. It is a feature, not a footnote.
4. **Monospace for numbers, serif for editorial headers, sans for everything else.** This three-font discipline is non-negotiable.
5. **One accent, one job.** The accent color signals "live data / latest reference." Nothing else gets to use it.

---

## 2. Color Tokens

All colors are defined as CSS custom properties on `:root`. Dark mode is default.

### Surface (background hierarchy)

| Token              | Hex        | Use                                    |
| ------------------ | ---------- | -------------------------------------- |
| `--surface-0`      | `#0A0B0D`  | App background (darkest)               |
| `--surface-1`      | `#101216`  | Card background                        |
| `--surface-2`      | `#16191F`  | Nested card / input background         |
| `--surface-3`      | `#1D2128`  | Hover state for surface-2              |
| `--surface-inset`  | `#08090B`  | Inset wells (chart background, code)   |

### Text

| Token              | Hex        | Use                                    |
| ------------------ | ---------- | -------------------------------------- |
| `--text-primary`   | `#E8E9EC`  | Headlines, body                        |
| `--text-secondary` | `#9BA0A8`  | Captions, labels, meta                 |
| `--text-tertiary`  | `#5E6470`  | Disabled, watermarks, eyebrow labels   |
| `--text-inverse`   | `#0A0B0D`  | Text on accent backgrounds             |

### Border

| Token              | Hex                       | Use                          |
| ------------------ | ------------------------- | ---------------------------- |
| `--border-subtle`  | `rgba(255,255,255,0.06)`  | Default card border          |
| `--border-default` | `rgba(255,255,255,0.10)`  | Input border, divider        |
| `--border-strong`  | `rgba(255,255,255,0.18)`  | Focus ring, selected state   |

### Accent (THE only accent ¡X use sparingly)

| Token              | Hex        | Use                                    |
| ------------------ | ---------- | -------------------------------------- |
| `--accent`         | `#7DD3C0`  | Latest rate values, selected nav, primary button bg |
| `--accent-dim`     | `#3F6A62`  | Accent at 50% ¡X chart line             |
| `--accent-glow`    | `rgba(125,211,192,0.08)` | Accent halo fill on chart area |

> **Rule:** The accent appears **at most 3 times on a given screen**. If you find yourself using it on 4+ elements, demote one to `--text-primary` or `--text-secondary`.

### Semantic

| Token              | Hex        | Use                                    |
| ------------------ | ---------- | -------------------------------------- |
| `--up`             | `#86C99C`  | Positive movement (rate went up)       |
| `--down`           | `#D69590`  | Negative movement (rate went down)     |
| `--info-bg`        | `#15171C`  | Info / disclaimer panel background     |
| `--info-bar`       | `#3F6A62`  | Left rail on disclaimer panel          |

> Up/down are muted on purpose. We are not a trading app. No bright red or bright green.

---

## 3. Typography

### Font families

```css
--font-serif: 'Fraunces', 'Source Serif Pro', Georgia, serif;
--font-sans: 'Geist', 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
```

> If self-hosting is a concern, use Google Fonts: Fraunces, Geist (or Inter as fallback), JetBrains Mono. All three are free and OFL.

### Type scale

| Token           | Size / Line-height | Weight | Family | Use                              |
| --------------- | ------------------ | ------ | ------ | -------------------------------- |
| `--text-display`| 56px / 64px        | 400    | serif  | Hero numbers (balance, latest rate) |
| `--text-h1`     | 32px / 40px        | 400    | serif  | Page title (e.g. "MarketMage")   |
| `--text-h2`     | 20px / 28px        | 500    | sans   | Section title                    |
| `--text-h3`     | 16px / 24px        | 500    | sans   | Card title                       |
| `--text-body`   | 14px / 22px        | 400    | sans   | Body text                        |
| `--text-meta`   | 13px / 20px        | 400    | sans   | Captions, footnotes              |
| `--text-eyebrow`| 11px / 16px        | 500    | sans   | Eyebrow label (UPPERCASE, +0.08em letter-spacing) |
| `--text-num-l`  | 40px / 48px        | 400    | mono   | Large numeric (rate cards)       |
| `--text-num-m`  | 24px / 32px        | 400    | mono   | Medium numeric                   |
| `--text-num-s`  | 14px / 20px        | 400    | mono   | Inline numeric (dates, deltas)   |

### Rules

- **All numbers use mono.** Currency codes (USD, CNY) also use mono, in `--text-secondary`.
- **All eyebrows are uppercase + letter-spaced.** Use them above every section title. Never use them as body text.
- **No serif for body.** Serif is reserved for `--text-display` and `--text-h1` only.
- **No font weight above 500.** Editorial restraint means no bold display fonts.

---

## 4. Spacing

8px base grid. Use these tokens only.

| Token       | Value | Use                                      |
| ----------- | ----- | ---------------------------------------- |
| `--space-1` | 4px   | Tight inline gaps                        |
| `--space-2` | 8px   | Within a label group                     |
| `--space-3` | 12px  | Between related elements                 |
| `--space-4` | 16px  | Default vertical rhythm inside a card    |
| `--space-5` | 24px  | Between cards (small)                    |
| `--space-6` | 32px  | Between major sections                   |
| `--space-7` | 48px  | Between page regions                     |
| `--space-8` | 64px  | Top of page                              |

---

## 5. Radius & Borders

| Token            | Value  | Use                          |
| ---------------- | ------ | ---------------------------- |
| `--radius-sm`    | 6px    | Inputs, small buttons, chips |
| `--radius-md`    | 10px   | Cards                        |
| `--radius-lg`    | 14px   | Large panels                 |
| `--radius-pill`  | 999px  | Tabs, pills                  |

Border width: always `1px`. No 2px borders anywhere.

---

## 6. Layout

### Page container

- Max width: `1180px`
- Side padding: `--space-6` (32px) on desktop, `--space-4` (16px) on mobile
- Center horizontally

### Grid

- Default: 12 columns, `--space-5` (24px) gutter
- Cards span 12, 8+4, 6+6, or 4+4+4

### Vertical rhythm

- Top of page: `--space-8` (64px)
- Between major sections: `--space-7` (48px)
- Between cards within a section: `--space-5` (24px)
- Inside a card: `--space-4` (16px) between elements

---

## 7. Components

### 7.1 Card

```
Background: --surface-1
Border: 1px solid --border-subtle
Radius: --radius-md
Padding: --space-5 (24px)
```

A card has:
1. (Optional) Eyebrow label at top
2. Card title (h3)
3. Content
4. (Optional) Meta line at bottom

No card shadows. Dark UI doesn't need shadow for depth ¡X surface contrast does that work.

### 7.2 Hero Number (rate / balance)

```
Eyebrow: --text-eyebrow, --text-tertiary
Label: --text-h3, --text-secondary
Value: --text-num-l, --text-primary (or --accent for "latest")
Unit: --text-num-s, --text-secondary, --space-2 to the left of value
Meta: --text-meta, --text-tertiary, beneath value
```

**Only the single "latest reference" value per screen gets `--accent`.** All other numbers are `--text-primary`.

### 7.3 Rate Card (in a row of currencies)

```
Currency code (mono, --text-secondary, eyebrow style)
Value (--text-num-l, --text-primary)
Inline meta: "1 USD = X.XXXX <code>" (--text-meta, --text-tertiary)
```

When selected:
- Border becomes `--border-strong`
- Background lifts to `--surface-2`
- Value color becomes `--accent`

### 7.4 Tab Bar (top-level navigation)

**Replace the current pill-container bottom nav with a top underline tabs.**

```
Container: bottom border --border-subtle
Each tab: --text-body, --text-secondary, padding --space-3 --space-4
Active tab: --text-primary + bottom border 1px solid --text-primary, offset -1px
Hover: --text-primary, no underline change
```

No pill background. No accent color on tabs. The active tab is identified by typography + underline only.

### 7.5 Disclaimer Panel (the trust banner)

**This is a centerpiece component. Do not minimize it.**

```
Background: --info-bg
Border: 1px solid --border-subtle
Border-left: 2px solid --info-bar
Radius: --radius-md
Padding: --space-5 --space-5
```

Inside:
- Eyebrow: "REFERENCE & SAFETY" (--text-eyebrow, --text-tertiary)
- Title: "What this product is, and isn't." (--text-h3, --text-primary)
- Five statements as a 2-column list on desktop, single column on mobile (--text-body, --text-secondary)
- Each statement prefixed by a small `¡P` in `--text-tertiary`

Statements (exact copy):
1. Daily reference rates, not real-time quotes.
2. Historical reference only ¡X not a forecast.
3. Not investment advice.
4. No deposits, withdrawals, or trades.
5. No trades are executed.

### 7.6 Input

```
Height: 40px
Background: --surface-2
Border: 1px solid --border-default
Radius: --radius-sm
Padding: 0 --space-3
Font: --text-body, sans for text, mono for numbers
Color: --text-primary
Placeholder: --text-tertiary

Focus: border --border-strong, no glow, no outline
```

### 7.7 Select

Same as input, with a chevron icon (lucide `ChevronDown`) at right, `--text-secondary`.

### 7.8 Button ¡X Primary

```
Background: --accent
Color: --text-inverse
Height: 40px
Padding: 0 --space-4
Radius: --radius-sm
Font: --text-body, weight 500
Hover: background slightly brighter (#8FDDCB)
Disabled: --surface-3 background, --text-tertiary color
```

### 7.9 Button ¡X Secondary

```
Background: transparent
Color: --text-primary
Border: 1px solid --border-default
Same dimensions as primary
Hover: background --surface-2
```

### 7.10 Slider (allocation control)

**Critical: do not use browser default styling.**

```
Track: height 4px, background --surface-3, radius --radius-pill
Filled portion: --accent-dim
Thumb: 16px circle, background --text-primary, border 2px solid --surface-0
Thumb hover: scale 1.1
```

### 7.11 Chart

```
Container: --surface-inset background, 1px solid --border-subtle, --radius-md
Padding: --space-5
Height: 280px on desktop, 220px on mobile

Line: 1.5px stroke, --accent-dim
Area fill: linear gradient from --accent-glow (top) to transparent (bottom)
Grid lines (horizontal only): 3 lines, 1px dashed --border-subtle
Axis labels: --text-meta, --text-tertiary
Data points: hidden by default
High/low markers: 4px filled circles, --accent, with --text-num-s label beside
Hover dot: 6px outlined circle, fill --surface-0, stroke --accent
Hover tooltip: --surface-2 bg, 1px --border-default, --radius-sm, padding --space-2 --space-3, --text-meta
```

### 7.12 Movement Indicator (the "moved down 0.43%" line)

Not a pill. Inline text below the chart:
```
¡õ 0.43% over 30 days ¡P Historical reference only
```

- Arrow + percentage: `--text-num-s`, `--down` (or `--up`)
- Rest: `--text-meta`, `--text-tertiary`
- Separator: middot in `--text-tertiary`

---

## 8. Logo / Wordmark

**Drop the purple-to-cyan gradient.** It contradicts the editorial direction.

Replace with:
- Wordmark "MarketMage" in `--font-serif`, weight 400, `--text-primary`, no gradient
- Optional: a small `M` monogram to the left, drawn as a single-stroke serif glyph in `--text-primary`, no fill, no glow

If you want a touch of distinction, the "M" of "Mage" can be in `--font-serif italic`. That's it. No more.

---

## 9. Iconography

Use `lucide-react` exclusively. 16px or 20px sizes only. `--text-secondary` color by default.

Icons used:
- `ChevronDown` ¡X select chevron
- `ArrowDown` / `ArrowUp` ¡X movement indicator
- `Info` ¡X disclaimer expand
- `Sun` / `Moon` ¡X theme toggle

No filled icons. No multi-color icons.

---

## 10. Motion

Restrained. Motion exists to communicate state, not to delight.

| Action                  | Duration | Easing                    |
| ----------------------- | -------- | ------------------------- |
| Hover state             | 120ms    | ease-out                  |
| Tab switch / panel show | 200ms    | cubic-bezier(.2,.8,.2,1)  |
| Chart line draw-in (load) | 600ms  | cubic-bezier(.2,.8,.2,1)  |

No bounce. No spring. No parallax. No scroll-jacking.

---

## 11. Light Mode (deferred)

Light mode is a v1 concern. The dark theme is canonical. When implementing light mode later, invert the surface scale and adjust accent to `#2E8576` for AA contrast on light backgrounds. Do not ship light mode in v0 if it's not polished.

---

## 12. What NOT to do

A non-exhaustive list of things that would break this design's voice:

- Gradients on text (especially purple/cyan)
- Multiple accent colors
- Glow / box-shadow with color
- Filled chart areas in saturated color
- Pill-style bottom navigation
- Browser-default sliders, checkboxes, scrollbars
- Numbers in proportional (non-mono) fonts
- Body text in serif
- Pills for status indicators that aren't actually statuses (the "Historical move down" chip)
- Emoji in product chrome
- Trade-y language: "Execute", "Buy", "Sell", "Live", "Real-time", "Now", "Auto"

---

## 13. Implementation Notes for Claude Code

When porting to React + Vite + TypeScript:

1. Put all tokens in `src/styles/tokens.css` as CSS custom properties on `:root`. Do not use a JS theme object.
2. Use Tailwind only if you map the tokens to Tailwind theme via `tailwind.config.js`. Otherwise, use plain CSS modules or vanilla CSS. Don't ship raw Tailwind utility soup that hardcodes hex values.
3. Components should be presentational and take data via props. No fetching inside design components.
4. Mono font for any `<output>`, `<time>`, currency code, or numeric value. Make a `<Num />` and `<Code />` component to enforce this ¡X it's the single biggest determinant of whether the UI looks professional.
5. The disclaimer panel is a top-level layout element, not buried in a footer. It appears on every page directly under the header.
6. The accent rule (at most 3 uses per screen) is enforced in code review, not by lint. If you find yourself adding a 4th, refactor.