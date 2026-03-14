# Translator Agent — Frontend UI Design Specification

> Version: 1.0 | Date: 2026-03-14 | Status: Draft
>
> Design language inspired by Claude.ai and Anthropic.com: warm, editorial, typography-first.

---

## 1. Color System

The palette shifts from the current Notion-inspired cool neutrals to a warm, cream-based system inspired by Claude.ai and Anthropic.com. The fundamental principle: **warm, not cold** — cream and sand replace stark white and gray.

### 1.1 Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-page` | `#F5F0E8` | Page-level background (replaces `#ffffff`) |
| `--color-bg-elevated` | `#FFFFFF` | Cards, modals, elevated surfaces |
| `--color-bg-sidebar` | `#2C2820` | Sidebar background (warm dark) |
| `--color-bg-sidebar-hover` | `#3A352C` | Sidebar item hover state |
| `--color-bg-sidebar-active` | `#443E34` | Sidebar item active/selected state |
| `--color-bg-input` | `#FFFFFF` | Input field background |
| `--color-bg-input-hover` | `#FAFAF7` | Input field hover |
| `--color-bg-secondary` | `#EDE8DF` | Secondary surfaces, empty states |
| `--color-bg-tertiary` | `#E6E0D5` | Tertiary backgrounds, table stripes |
| `--color-bg-chat-user` | `#E8E3DA` | User chat message bubble |
| `--color-bg-chat-assistant` | `transparent` | Assistant chat message (no bubble) |
| `--color-bg-upload` | `#FAF8F4` | Upload drop zone interior |
| `--color-bg-skeleton` | `#EDE8DF` | Skeleton loading placeholder |
| `--color-bg-skeleton-shine` | `#F5F0E8` | Skeleton loading shimmer |

### 1.2 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#1A1A1A` | Headings, primary body text |
| `--color-text-secondary` | `#6B6258` | Descriptions, labels, secondary info |
| `--color-text-tertiary` | `#9C9488` | Placeholders, timestamps, hints |
| `--color-text-disabled` | `#C4BEB5` | Disabled text |
| `--color-text-inverse` | `#FFFFFF` | Text on dark/accent backgrounds |
| `--color-text-sidebar` | `#D4CFC7` | Sidebar primary text |
| `--color-text-sidebar-muted` | `#8C8579` | Sidebar secondary text |

### 1.3 Accent / Action Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-accent-primary` | `#1A1A1A` | Primary buttons (solid black, like Claude.ai) |
| `--color-accent-primary-hover` | `#333333` | Primary button hover |
| `--color-accent-link` | `#8B6834` | Hyperlinks, inline interactive text |
| `--color-accent-link-hover` | `#6B4E24` | Link hover |
| `--color-accent-focus` | `rgba(139, 104, 52, 0.3)` | Focus ring color |

### 1.4 Semantic Colors

| Token | Hex | Light BG | Usage |
|-------|-----|----------|-------|
| `--color-success` | `#2E7D32` | `rgba(46, 125, 50, 0.08)` | Completed, confirmed states |
| `--color-warning` | `#C67A00` | `rgba(198, 122, 0, 0.08)` | Awaiting input, caution |
| `--color-error` | `#C62828` | `rgba(198, 40, 40, 0.08)` | Failed, destructive actions |
| `--color-info` | `#5A7A9B` | `rgba(90, 122, 155, 0.08)` | In progress, informational |

### 1.5 Border & Divider Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-border` | `#DDD8CF` | Standard borders (cards, inputs) |
| `--color-border-light` | `#E8E3DA` | Subtle dividers, section separators |
| `--color-border-dark` | `#C4BEB5` | Emphasized borders |
| `--color-border-input-focus` | `#1A1A1A` | Focused input border |

### 1.6 Pipeline Stage Colors

| Stage | Color | Light BG |
|-------|-------|----------|
| Plan | `#5A7A9B` | `rgba(90, 122, 155, 0.1)` |
| Clarify | `#C67A00` | `rgba(198, 122, 0, 0.1)` |
| Translate | `#8B6834` | `rgba(139, 104, 52, 0.1)` |
| Unify | `#2E7D32` | `rgba(46, 125, 50, 0.1)` |

### 1.7 Dark Mode

Dark mode uses the sidebar's warm dark palette extended to the full page:

| Token | Dark Value |
|-------|-----------|
| `--color-bg-page` | `#1C1A17` |
| `--color-bg-elevated` | `#252320` |
| `--color-bg-sidebar` | `#161412` |
| `--color-bg-input` | `#252320` |
| `--color-bg-secondary` | `#2C2A26` |
| `--color-text-primary` | `#E8E3DA` |
| `--color-text-secondary` | `#9C9488` |
| `--color-border` | `#3A3730` |
| `--color-accent-primary` | `#E8E3DA` |
| `--color-accent-primary-hover` | `#FFFFFF` |

---

## 2. Typography

### 2.1 Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-heading` | `"Source Serif 4", "Source Serif Pro", Georgia, "Times New Roman", serif` | Hero headings (h1, h2), login branding, page titles |
| `--font-body` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | All body text, UI labels, buttons, inputs |
| `--font-mono` | `"JetBrains Mono", "SF Mono", SFMono-Regular, Consolas, monospace` | Code blocks, language codes |

**Google Fonts import:**
```
Source Serif 4: weights 400, 600, 700
Inter: weights 400, 500, 600
JetBrains Mono: weight 400
```

### 2.2 Type Scale

Base size: `16px` on the root element. All sizes in `rem` for accessibility (with px equivalents for reference).

| Token | Size | px | Weight | Font | Usage |
|-------|------|----|--------|------|-------|
| `--text-display` | `3.5rem` | 56px | 700 | Heading | Login hero, marketing headlines |
| `--text-h1` | `2.25rem` | 36px | 700 | Heading | Page titles (dashboard welcome) |
| `--text-h2` | `1.75rem` | 28px | 600 | Heading | Section titles (project detail hero) |
| `--text-h3` | `1.375rem` | 22px | 600 | Heading | Card group titles |
| `--text-h4` | `1.125rem` | 18px | 600 | Body | Sub-section headings |
| `--text-h5` | `1rem` | 16px | 600 | Body | Minor headings, tab labels |
| `--text-h6` | `0.875rem` | 14px | 600 | Body | Overline text, uppercase labels |
| `--text-body-lg` | `1.0625rem` | 17px | 400 | Body | Lead paragraphs |
| `--text-body` | `0.9375rem` | 15px | 400 | Body | Default body copy |
| `--text-body-sm` | `0.875rem` | 14px | 400 | Body | Secondary descriptions |
| `--text-caption` | `0.8125rem` | 13px | 400 | Body | Timestamps, hints |
| `--text-overline` | `0.75rem` | 12px | 600 | Body | Overline text, uppercase labels |

### 2.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--weight-regular` | `400` | Body text, descriptions |
| `--weight-medium` | `500` | Buttons, labels, navigation items |
| `--weight-semibold` | `600` | Sub-headings, bold labels |
| `--weight-bold` | `700` | Hero headings, page titles |

### 2.4 Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--leading-tight` | `1.2` | Display text, hero headings |
| `--leading-heading` | `1.3` | Section headings (h2-h4) |
| `--leading-body` | `1.6` | Body text, paragraphs |
| `--leading-relaxed` | `1.8` | Long-form reading (chat messages, descriptions) |

### 2.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | `-0.02em` | Display and hero headings |
| `--tracking-normal` | `-0.01em` | Body text |
| `--tracking-wide` | `0.05em` | Overline text, uppercase labels |

---

## 3. Layout & Spacing

### 3.1 Spacing Scale

Base unit: `4px`. All spacing values are multiples of this base.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight inline spacing, icon gaps |
| `--space-2` | `8px` | Compact element spacing, small padding |
| `--space-3` | `12px` | Button padding (vertical), tight form gaps |
| `--space-4` | `16px` | Standard element spacing, input padding |
| `--space-5` | `20px` | Medium section gaps |
| `--space-6` | `24px` | Card padding, section spacing |
| `--space-8` | `32px` | Large section gaps |
| `--space-10` | `40px` | Page section separation |
| `--space-12` | `48px` | Major section dividers |
| `--space-16` | `64px` | Page-level top/bottom padding |
| `--space-20` | `80px` | Hero section padding |

### 3.2 Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--width-sidebar-collapsed` | `64px` | Sidebar in icon-only mode |
| `--width-sidebar-expanded` | `240px` | Sidebar in full mode |
| `--width-content-max` | `1120px` | Max content width in main area |
| `--width-content-narrow` | `640px` | Centered form layouts (new project) |
| `--width-content-wide` | `1280px` | Full-width data views |
| `--height-header` | `0px` | No separate header bar (integrated into sidebar) |
| `--width-chat-panel` | `100%` | Chat fills its tab pane |

### 3.3 Grid System

The main application uses a CSS-grid-based layout with a sidebar + content model:

```
+----------+----------------------------------------------+
|          |                                              |
| Sidebar  |              Content Area                    |
|  240px   |         flex: 1 (remaining width)            |
| (or 64px)|                                              |
|          |    +----------------------------------+       |
|          |    |     max-width: 1120px            |       |
|          |    |     margin: 0 auto               |       |
|          |    |     padding: 0 var(--space-8)    |       |
|          |    +----------------------------------+       |
|          |                                              |
+----------+----------------------------------------------+
```

Project list uses a responsive card grid:
- `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- Gap: `--space-6` (24px)

### 3.4 Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `xs` | < 640px | Sidebar hidden, single-column, bottom nav optional |
| `sm` | 640px - 1023px | Sidebar collapsed (64px), content fills rest |
| `md` | 1024px - 1279px | Sidebar collapsed by default, expandable on hover |
| `lg` | 1280px - 1535px | Sidebar expanded (240px) |
| `xl` | >= 1536px | Sidebar expanded, content max-width centered |

### 3.5 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | `0` | Normal flow |
| `--z-sidebar` | `100` | Sidebar overlay on mobile |
| `--z-dropdown` | `200` | Dropdowns, popovers |
| `--z-modal-backdrop` | `300` | Modal backdrop |
| `--z-modal` | `400` | Modal content |
| `--z-toast` | `500` | Toast notifications |

---

## 4. Component Specifications

### 4.a Login Page

The login page is a full-viewport, two-column split layout with no sidebar or header. It communicates editorial warmth and product confidence.

#### Layout Structure

```
+---------------------------------------------------+
|                                                     |
|   Left Column (45%)      Right Column (55%)         |
|   +-----------------+   +------------------------+  |
|   |                 |   |                        |  |
|   |  Brand Title    |   |   Product Preview      |  |
|   |  (serif, large) |   |   Illustration or      |  |
|   |                 |   |   screenshot mockup     |  |
|   |  Tagline        |   |                        |  |
|   |  (sans, muted)  |   |                        |  |
|   |                 |   |                        |  |
|   |  [Login Form]   |   |                        |  |
|   |   Email input   |   |                        |  |
|   |   Password      |   |                        |  |
|   |   [Sign In]     |   |                        |  |
|   |   Forgot? /     |   |                        |  |
|   |   Register      |   |                        |  |
|   |                 |   |                        |  |
|   +-----------------+   +------------------------+  |
|                                                     |
+---------------------------------------------------+
```

#### Specifications

- **Full viewport**: `min-height: 100vh`, `display: flex`
- **Left column**: `flex: 0 0 45%`, background `--color-bg-page` (#F5F0E8)
  - Content vertically centered with `display: flex; align-items: center; justify-content: center`
  - Inner container `max-width: 400px`, `padding: var(--space-16) var(--space-12)`
- **Right column**: `flex: 0 0 55%`, background `--color-bg-secondary` (#EDE8DF)
  - Contains centered product illustration or abstract decorative shapes
  - Decorative elements: large blurred circles in warm tones (sand, muted gold) — NOT blue/purple
  - Consider a subtle translucent document preview graphic showing translation flow
- **Brand title**: Font `--font-heading`, size `--text-display` (56px), weight 700, color `--color-text-primary`, `letter-spacing: --tracking-tight`, `line-height: --leading-tight`
- **Tagline**: Font `--font-body`, size `--text-body-lg` (17px), weight 400, color `--color-text-secondary`, margin-top `--space-3`
- **Form spacing**: Each field separated by `--space-5` (20px)
- **Input fields**: Height `48px`, `border-radius: 8px`, `border: 1px solid --color-border`, `padding: 0 var(--space-4)`, `font-size: --text-body` (15px). On focus: `border-color: --color-border-input-focus`, `box-shadow: 0 0 0 3px var(--color-accent-focus)`
- **Primary button (Sign In)**: `width: 100%`, `height: 48px`, `background: --color-accent-primary` (#1A1A1A), `color: --color-text-inverse`, `border-radius: 8px`, `font-size: --text-body`, `font-weight: --weight-medium`. Hover: `background: --color-accent-primary-hover`
- **Links**: Color `--color-accent-link`, `font-size: --text-body-sm`, hover underline
- **Top-right corner**: Theme toggle + language switch, position `absolute`, `top: var(--space-6)`, `right: var(--space-6)`

#### Responsive (< 960px)

- Right column: `display: none`
- Left column: `flex: 1`, `width: 100%`, centered card on `--color-bg-page` background
- Form card gets subtle shadow: `box-shadow: 0 8px 32px rgba(0,0,0,0.06)`
- Card: `background: --color-bg-elevated`, `border-radius: 16px`, `padding: var(--space-10) var(--space-8)`

---

### 4.b Main Layout (Authenticated)

The authenticated layout uses a warm dark sidebar with no separate header bar. User info is in the sidebar.

#### Layout Structure

```
+------+--------------------------------------------------+
|      |                                                    |
| Logo |                                                    |
| ---- |              Content Area                          |
| Nav  |     (scrollable, --color-bg-page background)       |
| Items|                                                    |
|      |         +--------------------------------+         |
|      |         | Page content, max 1120px       |         |
|      |         | centered, with --space-8       |         |
|      |         | horizontal padding             |         |
|      |         +--------------------------------+         |
| ---- |                                                    |
| User |                                                    |
| Info |                                                    |
+------+--------------------------------------------------+
```

#### Sidebar Specifications

- **Width**: `240px` expanded / `64px` collapsed
- **Background**: `--color-bg-sidebar` (#2C2820) — warm dark brown, NOT cool gray or black
- **Transition**: `width 0.25s cubic-bezier(0.16, 1, 0.3, 1)`
- **No border-right** — the dark background provides sufficient contrast with the cream content area
- **Structure** (top to bottom):
  1. **Logo area** (height: 56px): App icon (20px) + app name text. Padding `0 var(--space-4)`. Text in `--color-text-sidebar`, `font-size: --text-body`, `font-weight: --weight-semibold`. When collapsed, only icon visible.
  2. **Navigation items**: Vertical list. Each item is `height: 40px`, `border-radius: 8px`, `margin: 2px var(--space-2)`, `padding: 0 var(--space-3)`. Icon (18px) + label (`--text-body-sm`, 14px). Default color `--color-text-sidebar-muted` (#8C8579). Hover: `background: --color-bg-sidebar-hover`, `color: --color-text-sidebar`. Active: `background: --color-bg-sidebar-active`, `color: --color-text-sidebar`, `font-weight: --weight-medium`. When collapsed, tooltip shows label on hover.
  3. **Spacer**: `flex: 1` pushes user section to bottom
  4. **User section** (bottom): User avatar (32px circle) + username + logout icon. Separated from nav by a `1px solid rgba(255,255,255,0.08)` divider with `--space-3` vertical padding. When collapsed, only avatar visible.
  5. **Collapse toggle**: Small button at bottom of nav section or on the sidebar edge. Icon: chevron left/right.

#### Content Area Specifications

- **Background**: `--color-bg-page` (#F5F0E8)
- **No dot pattern** — the warm background is sufficient; dot patterns feel like a cold UI pattern
- **Overflow**: `overflow-y: auto` with styled scrollbar (same warm tones)
- **Inner container**: `max-width: var(--width-content-max)` (1120px), `margin: 0 auto`, `padding: var(--space-10) var(--space-8)` (40px top/bottom, 32px left/right)

---

### 4.c Project List Page

A grid of cards instead of the current list view, with a floating action button.

#### Layout

```
+------------------------------------------------------------------+
|  Translation Projects               [Search]  [Filter]  [Sort]   |
|  You have 12 projects                                             |
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  | English → 中文   |  | Deutsch → English|  | 日本語 → English |  |
|  | Annual Report    |  | User Manual      |  | Technical Spec   |  |
|  | 2026             |  |                  |  |                  |  |
|  |                  |  |                  |  |                  |  |
|  | ████████░░  80%  |  | ████████████ ✓   |  | ░░░░░░░░░░      |  |
|  | Translating      |  | Completed        |  | Created          |  |
|  | Mar 14, 2026     |  | Mar 13, 2026     |  | Mar 14, 2026     |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                    |
|  +------------------+  +------------------+                        |
|  | ...              |  | ...              |                        |
|  +------------------+  +------------------+                        |
|                                                                    |
|                                              [+] (floating button) |
+------------------------------------------------------------------+
```

#### Page Header

- **Title**: "Translation Projects", font `--font-heading`, size `--text-h1` (36px), weight 700, color `--color-text-primary`
- **Subtitle**: Project count, font `--font-body`, size `--text-body-sm` (14px), color `--color-text-secondary`, margin-top `--space-2`
- **Actions row**: Right-aligned. Search input (280px width, compact style), filter dropdown, sort dropdown. `margin-top: var(--space-6)`, `margin-bottom: var(--space-8)`

#### Project Card

- **Dimensions**: Minimum width `320px`, height auto (content-driven)
- **Background**: `--color-bg-elevated` (#FFFFFF)
- **Border**: `1px solid --color-border-light` (#E8E3DA)
- **Border-radius**: `12px`
- **Padding**: `--space-6` (24px)
- **Shadow**: `0 1px 3px rgba(0,0,0,0.04)` at rest
- **Hover**: `box-shadow: 0 8px 24px rgba(0,0,0,0.06)`, `transform: translateY(-2px)`, `transition: all 0.2s ease`
- **Cursor**: `pointer`
- **Content** (top to bottom):
  1. **Language pair**: `font-size: --text-overline` (12px), `text-transform: uppercase`, `letter-spacing: --tracking-wide`, `color: --color-text-tertiary`, `font-weight: --weight-semibold`. Format: `EN → ZH`
  2. **Title**: `font-size: --text-h4` (18px), `font-weight: --weight-semibold`, `color: --color-text-primary`, `margin-top: var(--space-2)`, max 2 lines with ellipsis
  3. **Progress bar**: `margin-top: var(--space-5)`. Height `4px`, `border-radius: 2px`, background `--color-bg-tertiary`. Fill color based on stage color from Section 1.6. Shows percentage for in-progress projects.
  4. **Status row**: `margin-top: var(--space-3)`, `display: flex`, `justify-content: space-between`, `align-items: center`
     - **Status badge**: Pill shape, `border-radius: 999px`, `padding: 2px 10px`, `font-size: --text-overline` (12px), `font-weight: --weight-medium`. Colors per status:
       - Created: `color: --color-text-secondary`, `background: --color-bg-secondary`
       - Planning/Translating/Unifying: `color: --color-info`, `background: var(--color-info-light)`
       - Clarifying: `color: --color-warning`, `background: var(--color-warning-light)`
       - Completed: `color: --color-success`, `background: var(--color-success-light)`
       - Failed: `color: --color-error`, `background: var(--color-error-light)`
     - **Date**: `font-size: --text-caption` (13px), `color: --color-text-tertiary`

#### Floating Action Button (FAB)

- **Position**: Fixed, `bottom: var(--space-8)`, `right: var(--space-8)` relative to the content area
- **Size**: `56px` circle
- **Background**: `--color-accent-primary` (#1A1A1A)
- **Icon**: Plus icon, `color: --color-text-inverse`, `20px`
- **Shadow**: `0 4px 16px rgba(0,0,0,0.15)`
- **Hover**: `transform: scale(1.05)`, `box-shadow: 0 6px 20px rgba(0,0,0,0.2)`
- **Click**: Navigates to `/projects/new`

#### Empty State

- Centered vertically and horizontally
- Illustration: Simple line art of a document with translation arrows (optional)
- Heading: "No projects yet", `--text-h3`, `--color-text-primary`
- Body: "Upload a document and start translating.", `--text-body`, `--color-text-secondary`
- CTA button: Same as primary button style, "Create Your First Project"

---

### 4.d New Project Page

A clean, centered, full-width form with a drag-and-drop upload zone and pill selectors for languages.

#### Layout

```
+------------------------------------------------------------------+
|                                                                    |
|  ← Back to Projects                                                |
|                                                                    |
|        +----------------------------------------------+            |
|        |                                              |            |
|        |  New Translation Project (serif heading)     |            |
|        |  Configure your translation settings.        |            |
|        |                                              |            |
|        |  ┌──────────────────────────────────────┐    |            |
|        |  │                                      │    |            |
|        |  │     📄 Drag & drop your document     │    |            |
|        |  │     or click to browse                │    |            |
|        |  │                                      │    |            |
|        |  │  .txt .md .html .pdf .docx (≤50MB)   │    |            |
|        |  └──────────────────────────────────────┘    |            |
|        |                                              |            |
|        |  Project Title                               |            |
|        |  [________________________]                  |            |
|        |                                              |            |
|        |  Target Language                             |            |
|        |  [zh] [en] [ja] [ko] [fr] [de] [es] ...     |            |
|        |                                              |            |
|        |  Source Language (optional)                   |            |
|        |  [Auto-detect] [en] [zh] [ja] [ko] ...      |            |
|        |                                              |            |
|        |  Formality                                   |            |
|        |  [Neutral] [Formal] [Informal]               |            |
|        |                                              |            |
|        |  [Create & Start Translation]                |            |
|        |                                              |            |
|        +----------------------------------------------+            |
|                                                                    |
+------------------------------------------------------------------+
```

#### Container

- **Max width**: `var(--width-content-narrow)` (640px)
- **Centering**: `margin: 0 auto`
- **Padding top**: `var(--space-10)` (40px)

#### Back Link

- Text: "Back to Projects", with left arrow icon
- `font-size: --text-body-sm`, `color: --color-text-secondary`
- Hover: `color: --color-text-primary`
- `margin-bottom: var(--space-8)`

#### Page Heading

- **Title**: "New Translation Project", font `--font-heading`, size `--text-h2` (28px), weight 600, color `--color-text-primary`
- **Subtitle**: "Configure your translation settings.", font `--font-body`, size `--text-body` (15px), color `--color-text-secondary`, `margin-top: var(--space-2)`, `margin-bottom: var(--space-10)`

#### Upload Zone

- **Height**: `180px`
- **Border**: `2px dashed --color-border` (#DDD8CF)
- **Border-radius**: `12px`
- **Background**: `--color-bg-upload` (#FAF8F4)
- **Display**: `flex`, column, centered
- **Icon**: Document icon, `40px`, `color: --color-text-tertiary`
- **Primary text**: "Drag & drop your document", `--text-body`, `--weight-medium`, `--color-text-secondary`
- **Secondary text**: "or click to browse", `--text-body-sm`, `--color-text-tertiary`
- **Format hint**: ".txt .md .html .pdf .docx (max 50MB)", `--text-caption`, `--color-text-tertiary`, `margin-top: var(--space-3)`
- **Hover state**: `border-color: --color-border-dark`, `background: --color-bg-secondary`
- **Drag-over state**: `border-color: --color-accent-primary`, `background: rgba(26,26,26,0.02)`
- **File selected state**: Replace interior with file info row: icon + filename + file size + remove button
- **Margin bottom**: `var(--space-8)`

#### Form Fields

- **Label**: `font-size: --text-body-sm` (14px), `font-weight: --weight-medium`, `color: --color-text-secondary`, `margin-bottom: var(--space-2)`
- **Field gap**: `var(--space-6)` (24px) between each field group

#### Language Selector (Pill/Tag Style)

Instead of a dropdown, languages are displayed as selectable pills:

- **Layout**: `display: flex`, `flex-wrap: wrap`, `gap: var(--space-2)` (8px)
- **Pill dimensions**: `padding: 6px 16px`, `border-radius: 999px`
- **Default state**: `background: --color-bg-elevated`, `border: 1px solid --color-border`, `color: --color-text-secondary`, `font-size: --text-body-sm`, `cursor: pointer`
- **Hover**: `border-color: --color-border-dark`, `color: --color-text-primary`
- **Selected**: `background: --color-accent-primary`, `color: --color-text-inverse`, `border-color: --color-accent-primary`
- **Each pill shows**: Language name + code, e.g., "Chinese (zh)" or just "中文"
- **Source language**: Add an "Auto-detect" pill as the first option, selected by default

#### Formality Selector

Same pill style as language selector but horizontal with only 3 options:

- `[Neutral]  [Formal]  [Informal]`
- Default selected: "Neutral"

#### Submit Button

- Full width within the form container
- `height: 48px`, `border-radius: 8px`
- `background: --color-accent-primary`, `color: --color-text-inverse`
- `font-size: --text-body`, `font-weight: --weight-medium`
- `margin-top: var(--space-8)`

---

### 4.e Project Detail Page

A rich detail page with a hero section and horizontal tab navigation.

#### Layout Structure

```
+------------------------------------------------------------------+
|                                                                    |
|  ← Projects                                                       |
|                                                                    |
|  Annual Report 2026 Translation         [Start] [Cancel]          |
|  English → 中文 (Chinese)                                          |
|                                                                    |
|  ┌─────────┬─────────┬─────────┬─────────┐                        |
|  │Pipeline │  Terms  │ Output  │  Chat   │                        |
|  └─────────┴─────────┴─────────┴─────────┘                        |
|                                                                    |
|  (Tab content area below)                                          |
|                                                                    |
+------------------------------------------------------------------+
```

#### Hero Section

- **Back link**: Same style as New Project page
- **Title**: Font `--font-heading`, size `--text-h2` (28px), weight 600, color `--color-text-primary`
- **Language pair**: Below title, `font-size: --text-body` (15px), `color: --color-text-secondary`. Format: "English → Chinese (中文)". Language names in full, not codes.
- **Action buttons**: Right-aligned in the hero section. Primary button for context-sensitive action (Start / Confirm Terms / Retry). Danger button for Cancel (shown only when pipeline is running).
- **Margin bottom**: `var(--space-8)` before tabs

#### Horizontal Tab Navigation

- **Style**: Underline tabs (not boxed)
- **Tab items**: `font-size: --text-body` (15px), `font-weight: --weight-medium`, `color: --color-text-secondary`, `padding: var(--space-3) var(--space-1)`, `margin-right: var(--space-8)`
- **Active tab**: `color: --color-text-primary`, `font-weight: --weight-semibold`, bottom border `2px solid --color-accent-primary`
- **Ink bar**: `height: 2px`, `background: --color-accent-primary` (solid black, NOT gradient)
- **Tab labels**: "Pipeline", "Terms (12)", "Output", "Chat"
  - Terms tab shows count in parentheses
  - Chat tab disabled (muted) until project status is `completed`
- **Tab content area**: `padding-top: var(--space-8)`, no border-top (clean separation by whitespace)

#### Pipeline Tab Content

A vertical step indicator instead of Arco's horizontal `Steps` component.

```
  ○─── Plan                     ✓ Completed
  │    Analyzed document structure, created 8 chunks.
  │
  ●─── Clarify                  ⏳ Awaiting confirmation
  │    Extracted 12 specialized terms.
  │    [Review Terms →]
  │
  ○─── Translate                ○ Pending
  │
  ○─── Unify                    ○ Pending
```

Specifications:
- **Vertical line**: `2px solid --color-border-light`, `margin-left: 11px` (centered on circle icons)
- **Step circles**: `24px` diameter, `border: 2px solid`
  - Pending: `border-color: --color-border`, `background: transparent`
  - Active/Running: `border-color: <stage-color>`, `background: <stage-color>`, with a pulsing animation (subtle scale 1.0 → 1.1 → 1.0, 2s infinite)
  - Awaiting Input: `border-color: --color-warning`, `background: --color-warning`
  - Completed: `border-color: --color-success`, `background: --color-success`, checkmark icon inside (white)
  - Failed: `border-color: --color-error`, `background: --color-error`, X icon inside (white)
- **Step title**: `font-size: --text-h5` (16px), `font-weight: --weight-semibold`, `color: --color-text-primary`, `margin-left: var(--space-4)` from the circle
- **Step status**: Right side, `font-size: --text-body-sm`, color matches step state semantic color
- **Step description**: Below title, `font-size: --text-body-sm`, `color: --color-text-secondary`, `margin-top: var(--space-1)`, `margin-left: var(--space-4)` from the circle. Pulled from `pipeline_task.result`.
- **Inline action**: For the Clarify step in `awaiting_input` state, show a "Review Terms" link-button that switches to the Terms tab. `font-size: --text-body-sm`, `color: --color-accent-link`.
- **Step spacing**: `var(--space-8)` (32px) between steps
- **Progress within Translate**: When translating, show "Chunk 3 of 10 completed" with a mini progress bar below the description

#### Terms Tab Content

A clean editable table with confirmation controls.

- **Table container**: `background: --color-bg-elevated`, `border-radius: 12px`, `border: 1px solid --color-border-light`, `overflow: hidden`
- **Table header**: `background: --color-bg-secondary`, `font-size: --text-body-sm`, `font-weight: --weight-semibold`, `color: --color-text-secondary`, `text-transform: uppercase`, `letter-spacing: --tracking-wide`, `padding: var(--space-3) var(--space-4)`
- **Table rows**: `padding: var(--space-4)`, `border-bottom: 1px solid --color-border-light`
- **Columns**:
  - Source Term: `font-weight: --weight-medium`, `font-size: --text-body`
  - Translation: `font-size: --text-body`. In edit mode, show inline input. Editable cells have a subtle dashed underline: `border-bottom: 1px dashed --color-border` to hint clickability.
  - Context: `font-size: --text-body-sm`, `color: --color-text-secondary`, `max-width: 300px`, ellipsis overflow
  - Status: Confirmed shows a `✓` checkmark icon in `--color-success`; Pending shows empty circle in `--color-text-tertiary`
- **Row hover**: `background: --color-bg-upload` (#FAF8F4)
- **Inline editing**: Click on translation cell to activate edit mode. Cell expands to show an input field with Save/Cancel buttons. Input has no outer border change; the cell itself gets `background: --color-bg-input`, `box-shadow: inset 0 0 0 1px --color-border-input-focus`.
- **Action bar above table** (when editable): `margin-bottom: var(--space-4)`. Contains "Confirm All & Continue" button (primary style) and count text "12 terms, 0 confirmed".

#### Output Tab Content

Download cards for generated artifacts.

```
  +-----------------------------------------------------+
  |  📄  Annual Report 2026 - Translation                |
  |      Markdown · 45.2 KB · Mar 14, 2026 14:30        |
  |                                          [Download]  |
  +-----------------------------------------------------+
  +-----------------------------------------------------+
  |  📑  Annual Report 2026 - Translation                |
  |      PDF · 128.7 KB · Mar 14, 2026 14:30            |
  |                                          [Download]  |
  +-----------------------------------------------------+
```

- **Card**: `background: --color-bg-elevated`, `border: 1px solid --color-border-light`, `border-radius: 12px`, `padding: var(--space-5) var(--space-6)`, `margin-bottom: var(--space-4)`
- **Layout**: Flex row. Left: icon (32px, semantic color per format) + text block. Right: download button.
- **Icon**: Document icon for Markdown, PDF icon for PDF. Color `--color-text-tertiary`.
- **Title**: `font-size: --text-body` (15px), `font-weight: --weight-medium`, `color: --color-text-primary`
- **Meta**: `font-size: --text-caption` (13px), `color: --color-text-tertiary`, `margin-top: var(--space-1)`. Format: "Markdown · 45.2 KB · Mar 14, 2026 14:30"
- **Download button**: Outline style, `border: 1px solid --color-border`, `border-radius: 8px`, `padding: 6px 16px`, `color: --color-text-secondary`. Hover: `border-color: --color-accent-primary`, `color: --color-accent-primary`.

#### Empty state (no artifacts)

- "Translation output will appear here once the pipeline completes."
- `--text-body`, `--color-text-secondary`, centered, `padding: var(--space-16) 0`

---

### 4.f Chat Panel (Chat Tab)

A full-height chat interface within the tab content area.

#### Layout Structure

```
+----------------------------------------------------------+
|                                                            |
|  Assistant                              Mar 14, 14:30     |
|  Hello! I can help you with questions about your          |
|  translation. Ask me about specific terms, phrasing       |
|  choices, or request modifications.                        |
|                                                            |
|                              Mar 14, 14:32     You        |
|                  Why was "machine learning" translated     |
|                  as "机器学习" instead of "机器习得"?       |
|                                                            |
|  Assistant                              Mar 14, 14:32     |
|  The term "机器学习" is the standard, widely accepted      |
|  translation in the technical domain...                    |
|                                                            |
+----------------------------------------------------------+
|  [Type your message...                        ] [→]       |
+----------------------------------------------------------+
```

#### Container

- **Height**: `calc(100vh - 280px)` (viewport minus sidebar header, tab bar, padding). Minimum: `500px`.
- **Display**: `flex`, `flex-direction: column`

#### Message Area

- **Flex**: `1`, `overflow-y: auto`
- **Padding**: `var(--space-6)`
- **Scroll behavior**: `smooth`
- **Auto-scroll**: Scroll to bottom on new message

#### Message Bubbles

**User messages** (right-aligned):
- `display: flex`, `flex-direction: column`, `align-items: flex-end`
- **Bubble**: `background: --color-bg-chat-user` (#E8E3DA), `color: --color-text-primary`, `border-radius: 16px 16px 4px 16px`, `padding: var(--space-3) var(--space-4)`, `max-width: 75%`
- **Sender line**: Above bubble, `font-size: --text-overline` (12px), `color: --color-text-tertiary`. Shows "You" + timestamp on same line with space between.
- `margin-bottom: var(--space-5)`

**Assistant messages** (left-aligned):
- `display: flex`, `flex-direction: column`, `align-items: flex-start`
- **No bubble background** — text renders directly on the page background
- `padding: var(--space-3) 0`, `max-width: 85%`
- **Sender line**: "Assistant" + timestamp, same style as user
- **Markdown rendering**: Support for bold, italic, inline code, code blocks, lists, links. Code blocks get `background: --color-bg-secondary`, `border-radius: 8px`, `padding: var(--space-3) var(--space-4)`, `font-family: --font-mono`
- `margin-bottom: var(--space-5)`

#### Input Area

- **Border top**: `1px solid --color-border-light`
- **Padding**: `var(--space-4) var(--space-6)`
- **Layout**: `display: flex`, `align-items: center`, `gap: var(--space-3)`
- **Input**: `flex: 1`, `height: 44px`, `border: 1px solid --color-border`, `border-radius: 999px` (fully rounded), `padding: 0 var(--space-4)`, `font-size: --text-body`. Focus: `border-color: --color-border-input-focus`, `box-shadow: 0 0 0 3px var(--color-accent-focus)`
- **Send button**: `width: 40px`, `height: 40px`, `border-radius: 50%`, `background: --color-accent-primary`, `color: --color-text-inverse`. Icon: arrow-up or send icon, 18px. No text label. Disabled state: `opacity: 0.4`, `cursor: not-allowed`. Hover: `background: --color-accent-primary-hover`.

---

## 5. Specific Page Layouts

### 5.1 Login Page

| Screen Region | Width | Content |
|---------------|-------|---------|
| Left column | 45% | Brand + form (centered, max 400px inner) |
| Right column | 55% | Decorative illustration |
| Top actions | absolute | Theme + language toggles, 24px from edges |

**Responsive < 960px**: Single column, centered card on warm background.
**Responsive < 640px**: Card fills width minus 16px padding, reduced internal padding.

### 5.2 Dashboard

| Screen Region | Width | Content |
|---------------|-------|---------|
| Welcome section | 100% of content container | Heading + subtitle |
| Stats grid | 100% | 2-3 column auto-fit grid, min 280px per card |
| Actions | 100% | Left-aligned button row |

### 5.3 Project List

| Screen Region | Width | Content |
|---------------|-------|---------|
| Page header | 100% of content container | Title + subtitle left, search/filter right |
| Card grid | 100% | `repeat(auto-fill, minmax(320px, 1fr))`, gap 24px |
| FAB | fixed | Bottom-right of content area |

### 5.4 New Project

| Screen Region | Width | Content |
|---------------|-------|---------|
| Back link | 100% of content container | Left-aligned |
| Form container | 640px centered | All form fields |
| Upload zone | 100% of form container | Full-width drag-drop area |

### 5.5 Project Detail

| Screen Region | Width | Content |
|---------------|-------|---------|
| Hero | 100% of content container | Title + meta left, actions right |
| Tab bar | 100% | Full width underline tabs |
| Tab content | 100% | Pipeline/Terms/Output fill width; Chat uses full height |

### 5.6 Mobile Considerations (< 640px)

- Sidebar: Hidden by default, hamburger menu button in top-left
- Sidebar opens as full-screen overlay with `--color-bg-sidebar` background, `z-index: --z-sidebar`
- Project cards: Single column, full width
- Project detail tabs: Horizontally scrollable tab bar
- Chat panel: Full-screen view when active (navigate into it like a sub-page)
- Upload zone: Reduced height (120px), simplified text
- Language pills: Wrap to multiple rows, smaller padding

---

## 6. Animation & Transitions

### 6.1 Core Transition Timing

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.2, 0, 0, 1)` | General UI transitions |
| `--ease-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, layout shifts |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, removals |
| `--duration-fast` | `100ms` | Hovers, color changes |
| `--duration-normal` | `200ms` | Most transitions |
| `--duration-slow` | `350ms` | Layout changes, entrances |

### 6.2 Page Transitions

- **Route change**: Content area fades in with slight upward motion
  - `opacity: 0 → 1`, `transform: translateY(8px) → translateY(0)`
  - Duration: `--duration-slow`, easing: `--ease-spring`
  - No exit animation (instant cut)

### 6.3 Pipeline Progress Animations

- **Stage activation**: Circle icon scales up `1.0 → 1.05 → 1.0` with a brief glow (`box-shadow: 0 0 0 4px <stage-color-light>`)
- **Active stage pulse**: Gentle scale animation `1.0 → 1.08 → 1.0`, `2s infinite`, easing: `ease-in-out`
- **Progress bar fill**: Width transition, `duration: 600ms`, easing: `--ease-spring`
- **Stage completion**: Checkmark icon appears with a slight bounce (`transform: scale(0) → scale(1.1) → scale(1)`, 300ms)
- **Vertical line fill**: The line between completed stages fills with the success color, animated from top to bottom

### 6.4 Loading States

**Skeleton screens, NOT spinners.** Loading states match the eventual content layout.

- **Project card skeleton**: Card shape with internal rectangles for language pair, title, progress bar, status. Animated shimmer: linear gradient moving left-to-right, `background-size: 200%`, `animation: shimmer 1.5s infinite`
- **Shimmer gradient**: `linear-gradient(90deg, --color-bg-skeleton 25%, --color-bg-skeleton-shine 50%, --color-bg-skeleton 75%)`
- **Pipeline skeleton**: Vertical circles with lines, pulsing gently
- **Chat skeleton**: 3-4 message-shaped blocks alternating left/right alignment
- **Table skeleton**: Row-shaped rectangles within the table container

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 6.5 Micro-interactions

- **Button press**: `transform: scale(0.98)` on `:active`, `--duration-fast`
- **Card hover lift**: `transform: translateY(-2px)`, `--duration-normal`
- **Tab switch**: Ink bar slides horizontally with `--duration-normal`, `--ease-spring`
- **Chat message enter**: Fade in + slight slide from bottom, `--duration-slow`, `--ease-spring`
- **Upload zone drag-over**: Border color transition, `--duration-fast`
- **FAB hover**: `transform: scale(1.05)`, `--duration-normal`
- **Sidebar collapse/expand**: Width transition `--duration-slow`, `--ease-spring`. Nav labels fade in/out with `--duration-normal`.

### 6.6 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Implementation Notes

### 7.1 CSS Custom Properties

All colors, spacing, and typography tokens MUST be defined as CSS custom properties on `:root`. This enables:
- Runtime theme switching (light/dark)
- Easy design iteration
- Component-level overrides where needed

```css
:root {
  /* Colors */
  --color-bg-page: #F5F0E8;
  --color-bg-elevated: #FFFFFF;
  --color-bg-sidebar: #2C2820;
  /* ... all tokens from Section 1 ... */

  /* Typography */
  --font-heading: "Source Serif 4", "Source Serif Pro", Georgia, serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  /* ... all tokens from Section 2 ... */

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  /* ... all tokens from Section 3 ... */
}

body[data-theme="dark"] {
  --color-bg-page: #1C1A17;
  --color-bg-elevated: #252320;
  /* ... dark overrides ... */
}
```

### 7.2 Google Fonts Integration

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">
```

### 7.3 Arco Design Theme Override Strategy

The existing `arco-overrides.less` approach is correct but needs to be updated for the new warm palette. Key overrides:

1. **Primary color**: Override Arco's blue (`#165DFF`) with `--color-accent-primary` (#1A1A1A). Use Arco's `@arcoblue-6` Less variable or the CSS custom property `--primary-6`.
2. **Border radius**: Override Arco's default 4px to 8px globally for inputs and buttons, 12px for cards.
3. **Font family**: Override Arco's default font stack with `--font-body`.
4. **Input styling**: Override Arco's input border colors to use warm tones.
5. **Color functional tokens**: Override Arco's gray scale (`--gray-1` through `--gray-10`) with warm equivalents.

Implementation path:
```less
// In arco-overrides.less or a new theme.less
:root {
  // Override Arco's blue primary with black
  --primary-6: #1A1A1A;
  --primary-5: #333333;
  --primary-7: #000000;

  // Override Arco's gray scale with warm grays
  --gray-1: #FAF8F4;
  --gray-2: #F5F0E8;
  --gray-3: #EDE8DF;
  --gray-4: #E6E0D5;
  --gray-5: #DDD8CF;
  --gray-6: #C4BEB5;
  --gray-7: #9C9488;
  --gray-8: #6B6258;
  --gray-9: #3A352C;
  --gray-10: #1A1A1A;
}
```

### 7.4 CSS Reset / Normalize

Keep the existing `reset.less` structure. Update:
- `background: --color-bg-page` (instead of `#ffffff`)
- `color: --color-text-primary`
- `font-family: var(--font-body)`
- `font-size: 16px` (rem base)
- Selection color: warm accent instead of blue

### 7.5 File Structure Updates

The existing Less file structure is compatible. Add/modify:

```
src/styles/
├── variables.less      → Rewrite with new warm palette tokens
├── reset.less          → Update with new base colors/fonts
├── arco-overrides.less → Update with warm palette overrides
├── transitions.less    → Update with new timing tokens
├── global.less         → Import entry point (unchanged)
└── typography.less     → NEW: heading/body type utility classes
```

### 7.6 Serif Font Usage

The serif font (`Source Serif 4`) is used ONLY for:
- Login page brand title
- Page titles (h1, h2 on project list, project detail, new project headings)
- Dashboard welcome heading
- Empty state headings

It is NOT used for:
- Navigation items
- Button labels
- Form labels
- Table headers
- Body text
- Chat messages

### 7.7 Icon Strategy

Continue using Arco Design's icon set (`@arco-design/web-react/icon`) for UI chrome. For custom needs (file type icons, pipeline stage icons), consider:
- Simple SVG icons with `currentColor` for easy color inheritance
- Icon size convention: `16px` for inline, `18px` for navigation, `20px` for buttons, `24px` for pipeline circles, `32px` for empty states and artifact cards

### 7.8 Component Migration Priority

Implement the design system in this order:

1. **CSS variables + fonts** (global foundation)
2. **Arco theme overrides** (everything warm immediately)
3. **Sidebar + Main Layout** (structural change, most visible)
4. **Login page** (complete redesign)
5. **Project list → card grid** (visual upgrade)
6. **New project page** (upload zone + pill selectors)
7. **Project detail → pipeline view** (vertical steps)
8. **Chat panel** (bubble redesign)
9. **Terms table** (polish)
10. **Output tab** (download cards)
11. **Loading skeletons** (replace spinners)
12. **Dark mode pass** (verify all warm dark tokens)

### 7.9 Theme Toggle Attribute

Switch from Arco's `arco-theme` body attribute to a custom `data-theme` attribute for more control:

```typescript
// Toggle dark mode
document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
// Also set Arco's attribute for their internal components
document.body.setAttribute('arco-theme', isDark ? 'dark' : '');
```

### 7.10 Performance Notes

- **Font loading**: Use `font-display: swap` (handled by Google Fonts `&display=swap`)
- **CSS custom properties**: Avoid recalculating expensive properties on every frame. Keep animations on `transform` and `opacity` only.
- **Skeleton screens**: Render immediately with the page shell, no flash of empty content
- **Image lazy loading**: For any product illustrations on the login page, use `loading="lazy"`

---

## Appendix A: Color Comparison (Before → After)

| Element | Current | New |
|---------|---------|-----|
| Page background | `#FFFFFF` | `#F5F0E8` (warm cream) |
| Sidebar background | `#F7F7F5` | `#2C2820` (warm dark) |
| Primary action | `#2383E2` (blue) | `#1A1A1A` (black) |
| Text primary | `#1A1A1A` | `#1A1A1A` (unchanged) |
| Text secondary | `#6B6B6B` | `#6B6258` (warmer) |
| Border | `#E9E9E7` | `#DDD8CF` (warmer) |
| Card background | `#FFFFFF` | `#FFFFFF` (unchanged, elevated) |
| Input background | `#FFFFFF` | `#FFFFFF` (unchanged) |
| Input focus ring | `rgba(35,131,226,0.1)` (blue) | `rgba(139,104,52,0.3)` (warm) |
| Gradient accents | Blue → Purple | Removed (solid colors only) |

## Appendix B: Status Badge Color Map

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| `created` | `#EDE8DF` | `#6B6258` | none |
| `planning` | `rgba(90,122,155,0.1)` | `#5A7A9B` | none |
| `clarifying` | `rgba(198,122,0,0.1)` | `#C67A00` | none |
| `translating` | `rgba(139,104,52,0.1)` | `#8B6834` | none |
| `unifying` | `rgba(90,122,155,0.1)` | `#5A7A9B` | none |
| `completed` | `rgba(46,125,50,0.1)` | `#2E7D32` | none |
| `failed` | `rgba(198,40,40,0.1)` | `#C62828` | none |
| `cancelled` | `#EDE8DF` | `#9C9488` | none |
