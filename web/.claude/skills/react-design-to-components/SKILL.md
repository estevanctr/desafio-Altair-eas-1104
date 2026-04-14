---
name: react-design-to-components
description: Converts design inputs (screenshots, Figma frames, or descriptions) into production-ready React components using shadcn/ui, Tailwind CSS v4, TypeScript, and class-variance-authority. Use this skill whenever the user wants to: convert a design to React/TypeScript code, build UI components following shadcn patterns, scaffold components from a visual reference or description, extend shadcn with new variants, or compose UI from Figma/screenshots. Trigger even if the user just says "turn this into a component", "build this UI", "make a React component for X", or shares any visual/screenshot and asks for code. Always consult this skill before writing any React UI code — it contains mandatory stack rules, naming conventions, and anti-patterns to avoid.
---

# React Design → Components Skill

Convert any design input (screenshot, Figma frame, or description) into production-ready React components following the project's conventions.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | React 19 (no `forwardRef`, use `React.ComponentProps`) |
| Language | TypeScript strict |
| Styling | Tailwind CSS v4 with `@theme inline` and CSS variables |
| Base components | **shadcn/ui** — always check before creating |
| Headless behaviors | **Base UI React** (`@base-ui/react`) for gaps shadcn doesn't cover |
| Variants | **class-variance-authority** (`cva`) |
| Class merging | **`cn`** from `@/lib/utils` — never `twMerge` directly |
| Icons | **Lucide React** |

---

## Step 1 — Identify Existing shadcn Components

Before writing a single line, check if `components/ui/` already has what you need:

```
button.tsx, card.tsx, input.tsx, label.tsx, badge.tsx,
separator.tsx, dialog.tsx, select.tsx, tabs.tsx, ...
```

| Situation | Action |
|---|---|
| Component exists | Import and compose — do not recreate |
| Component missing | Create following the shadcn template below |
| Exists but needs new variant | Extend with `cva` in the original file, or create a typed wrapper |

---

## Step 2 — Analyze the Design

Walk through the design and identify:
1. **Atoms** — buttons, inputs, badges, icons
2. **Molecules** — cards, form groups, list items
3. **Organisms** — sections, sidebars, modals
4. **States** — default, hover, focus, disabled, error, loading
5. **Responsive breakpoints** needed

Map each to an existing shadcn component or flag it for creation.

---

## Step 3 — Component Template (shadcn pattern)

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(
  // base classes
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        md: "px-4 py-3 text-sm",
        lg: "px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

function MyComponent({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof componentVariants>) {
  return (
    <div
      data-slot="my-component"
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { MyComponent }
export { componentVariants } // only if other components need it
```

---

## Naming Conventions

- **Files**: lowercase with hyphens → `user-card.tsx`, `use-modal.ts`
- **shadcn components**: `components/ui/`
- **Product components**: `components/` (outside `ui/`)
- **Exports**: named exports via `export {}` at the bottom (no default exports, no barrel files)

---

## Color System — Always Use CSS Variables

Never use hardcoded values like `#fff` or `oklch(...)`.

```
Backgrounds:   bg-background  bg-card  bg-popover
Actions:       bg-primary  bg-secondary  bg-muted  bg-accent
Danger:        bg-destructive

Text:          text-foreground         (primary)
               text-muted-foreground   (secondary/disabled)
               text-primary-foreground (on bg-primary)
               text-card-foreground    (on bg-card)

Borders:       border-border  border-input  border-destructive
Focus:         ring-ring
```

**Border radius tokens:**
```
rounded-sm  → --radius-sm  (≈ 60% of base)
rounded-md  → --radius-md  (≈ 80% of base)
rounded-lg  → --radius-lg  (= base --radius)
rounded-xl  → --radius-xl  (≈ 140% of base)
```

---

## TypeScript Rules

```tsx
// ✅ ComponentProps — no extra imports needed
function Card({ className, ...props }: React.ComponentProps<"div">) {}

// ✅ VariantProps from cva
import { cva, type VariantProps } from "class-variance-authority"

// ❌ Never React.FC
// ❌ Never `any`
// ❌ Never forwardRef (React 19 passes ref via props natively)
```

---

## Required Patterns

```tsx
// Always cn() for class merging
className={cn("base-classes", className)}

// Always data-slot for component identification
<div data-slot="card">

// State via data-attributes (for group-data targeting)
data-size={size}
className="group-data-[size=sm]/card:px-3"

// Focus visible (every interactive element)
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"

// Icons — controlled sizing
import { Check } from "lucide-react"
<Check className="size-4" />
"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

// Icon-only buttons require aria-label
<button aria-label="Close"><X className="size-4" /></button>

// Always spread remaining props last
{...props}

// Dark mode via class modifier
"dark:bg-muted dark:text-foreground"
```

---

## Composing with Existing shadcn

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Typed wrapper pattern
function IconButton({
  icon: Icon,
  label,
  ...props
}: ButtonProps & { icon: LucideIcon; label: string }) {
  return (
    <Button size="icon" aria-label={label} {...props}>
      <Icon />
    </Button>
  )
}
```

---

## When to Use Base UI

Only reach for `@base-ui/react` when shadcn has no equivalent:

```tsx
import * as Collapsible from "@base-ui/react/collapsible"
import * as NumberField from "@base-ui/react/number-field"
import * as Slider from "@base-ui/react/slider"
```

---

## Pre-Delivery Checklist

Before returning any component code, verify:

- [ ] Checked `components/ui/` for existing shadcn equivalents
- [ ] File is lowercase-with-hyphens in correct directory
- [ ] Named exports via `export {}` at the bottom
- [ ] Uses `React.ComponentProps<"element">` + `VariantProps` (no `React.FC`)
- [ ] Variants defined with `cva()`, classes merged with `cn()`
- [ ] `data-slot` attribute on root element
- [ ] States handled via `data-[state]:` and `group-data-[state]:`
- [ ] Only CSS variable colors (no hardcoded hex/oklch)
- [ ] Dark mode covered with `dark:` variants
- [ ] Focus visible styles on all interactive elements
- [ ] `aria-label` on icon-only buttons
- [ ] `{...props}` spread last on the root element
