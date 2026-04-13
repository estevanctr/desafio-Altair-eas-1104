# Conversão de Design para Componentes React

Analise o design fornecido (screenshot, frame do Figma ou descrição) e converta para componentes React seguindo os padrões abaixo.

---

## Stack

- **React 19** (sem `forwardRef`, usar `React.ComponentProps`)
- **TypeScript** strict
- **Tailwind CSS v4** com `@theme inline` e CSS variables
- **shadcn/ui** como base de componentes — sempre verificar se já existe antes de criar
- **Base UI React** (`@base-ui/react`) para comportamentos headless não cobertos pelo shadcn
- **class-variance-authority** (`cva`) para variantes
- **`cn`** de `@/lib/utils` para merge de classes (nunca `twMerge` diretamente)
- **Lucide React** para ícones

---

## Regra principal: shadcn primeiro

Antes de criar qualquer componente, verifique se já existe em `components/ui/`:

```
button.tsx, card.tsx, input.tsx, label.tsx, badge.tsx,
separator.tsx, dialog.tsx, select.tsx, tabs.tsx, ...
```

- **Existe** → importe e componha, não recrie
- **Não existe** → crie seguindo os padrões shadcn abaixo
- **Existe mas precisa de variante nova** → estenda com `cva` no próprio arquivo ou crie um wrapper

---

## Nomenclatura

- Arquivos: **lowercase com hífens** → `user-card.tsx`, `use-modal.ts`
- Componentes shadcn em `components/ui/`
- Componentes de produto em `components/` (fora de `ui/`)
- **Named exports via `export {}`** no final do arquivo (padrão shadcn)
- Sem barrel files (`index.ts`)

---

## Estrutura de Componente (padrão shadcn)

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
```

---

## Cores (CSS Variables do projeto)

Use sempre as CSS variables — nunca valores hardcoded como `#fff` ou `oklch(...)`.

```
bg-background, bg-card, bg-popover   → fundos
bg-primary, bg-secondary, bg-muted   → ações/estados
bg-accent                            → hover/highlight
bg-destructive                       → erros/danger

text-foreground                      → texto principal
text-muted-foreground                → texto secundário/desabilitado
text-primary-foreground              → texto em bg-primary
text-card-foreground                 → texto em bg-card

border-border, border-input          → bordas padrão
border-destructive                   → bordas de erro

ring-ring                            → focus ring
```

**Radius do projeto:**
```
rounded-sm  → --radius-sm  (calc(var(--radius) * 0.6))
rounded-md  → --radius-md  (calc(var(--radius) * 0.8))
rounded-lg  → --radius-lg  (var(--radius))
rounded-xl  → --radius-xl  (calc(var(--radius) * 1.4))
```

---

## TypeScript

```tsx
// ✅ React.ComponentProps sem import explícito (já importado como namespace)
function Card({ className, ...props }: React.ComponentProps<"div">) {}

// ✅ VariantProps de class-variance-authority
import { cva, type VariantProps } from "class-variance-authority"

// ✅ Import type para tipos externos
import type { VariantProps } from "class-variance-authority"

// ❌ Não usar React.FC
// ❌ Não usar any
// ❌ Não usar forwardRef (React 19 passa ref via props)
```

---

## Padrões Importantes

```tsx
// Sempre cn() para classes
className={cn("classes-base", className)}

// Sempre data-slot para identificação
<div data-slot="card">

// Estados com data-attributes
data-size={size}
className="group-data-[size=sm]/card:px-3"

// Focus visible
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"

// Ícones
import { Check } from "lucide-react"
<Check className="size-4" />
"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

// Botões de ícone precisam de aria-label
<button aria-label="Fechar"><X className="size-4" /></button>

// Props spread no final
{...props}

// Dark mode via classe
"dark:bg-muted dark:text-foreground"
```

---

## Composição com shadcn existente

```tsx
// ✅ Importe e componha componentes shadcn existentes
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// ✅ Estenda variantes existentes no arquivo de origem
// Em components/ui/button.tsx, adicione nova variante ao cva existente

// ✅ Crie wrappers tipados quando necessário
function IconButton({ icon: Icon, label, ...props }: ButtonProps & { icon: LucideIcon; label: string }) {
  return (
    <Button size="icon" aria-label={label} {...props}>
      <Icon />
    </Button>
  )
}
```

---

## Base UI (quando shadcn não cobre)

```tsx
// Use apenas para comportamentos não disponíveis no shadcn
import * as Collapsible from "@base-ui/react/collapsible"
import * as NumberField from "@base-ui/react/number-field"
import * as Slider from "@base-ui/react/slider"
```

---

## Export (padrão shadcn)

```tsx
// ✅ Named exports agrupados no final
export { Alert, AlertTitle, AlertDescription }
export { alertVariants } // exporte variantes se outros componentes precisarem
```

---

## Checklist

- [ ] Verificou se componente já existe em `components/ui/`
- [ ] Arquivo lowercase com hífens em `components/ui/` (shadcn) ou `components/` (produto)
- [ ] Named export via `export {}` no final
- [ ] `React.ComponentProps<"elemento">` + `VariantProps`
- [ ] Variantes com `cva()`, classes com `cn()`
- [ ] `data-slot` para identificação
- [ ] Estados via `data-[state]:` e `group-data-[state]:`
- [ ] Cores do tema (CSS variables, nunca hardcoded)
- [ ] Dark mode coberto com `dark:`
- [ ] Focus visible em interativos
- [ ] `aria-label` em botões de ícone
- [ ] `{...props}` no final

---

Analise o design fornecido, verifique quais componentes shadcn já existem que podem ser reaproveitados, e gere o código seguindo os padrões acima. Verifique o checklist ao final.
