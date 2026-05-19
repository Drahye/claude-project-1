---
name: design-systems
description: Build and maintain design systems including token architecture, component libraries, Figma organization, and design-to-code handoff. Use when creating a component library, establishing visual consistency, scaling a design team, or bridging the gap between design and engineering.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Design Systems

You are a design systems expert. Your goal is to help teams build a shared visual language that scales — one where designers and engineers speak the same language and consistency is automatic, not effortful.

## When to Use

- Starting a component library from scratch
- Inconsistency is creeping into the product (different buttons, spacing, colors)
- Design-to-engineering handoff is slow or error-prone
- Scaling from 1 to 3+ designers on a product
- Migrating from hardcoded values to design tokens
- Auditing an existing system for gaps or bloat

---

## Design Token Architecture

Tokens are the foundation. Three layers:

```
Primitive Tokens (raw values)
  └─ Semantic Tokens (purpose-based aliases)
        └─ Component Tokens (component-specific)
```

### Layer 1: Primitive Tokens
```json
{
  "color": {
    "blue-50": "#eff6ff",
    "blue-500": "#3b82f6",
    "blue-900": "#1e3a8a",
    "gray-0": "#ffffff",
    "gray-950": "#030712"
  },
  "spacing": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "12": "48px",
    "16": "64px"
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "full": "9999px"
  },
  "font-size": {
    "xs": "12px",
    "sm": "14px",
    "base": "16px",
    "lg": "18px",
    "xl": "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px"
  }
}
```

### Layer 2: Semantic Tokens
```json
{
  "color": {
    "background": {
      "default": "{color.gray-0}",
      "subtle": "{color.gray-50}",
      "inverse": "{color.gray-950}"
    },
    "text": {
      "default": "{color.gray-950}",
      "muted": "{color.gray-500}",
      "inverse": "{color.gray-0}",
      "brand": "{color.blue-500}"
    },
    "border": {
      "default": "{color.gray-200}",
      "strong": "{color.gray-400}"
    },
    "interactive": {
      "primary": "{color.blue-500}",
      "primary-hover": "{color.blue-600}",
      "primary-active": "{color.blue-700}"
    },
    "feedback": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "{color.blue-500}"
    }
  }
}
```

### Layer 3: Component Tokens
```json
{
  "button": {
    "primary": {
      "background": "{color.interactive.primary}",
      "background-hover": "{color.interactive.primary-hover}",
      "text": "{color.text.inverse}",
      "padding-x": "{spacing.4}",
      "padding-y": "{spacing.2}",
      "radius": "{radius.md}"
    }
  }
}
```

**Dark mode = swap semantic tokens only.** Primitives don't change.

---

## Component Architecture

### Anatomy of a Good Component

```tsx
// Button — well-structured component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  isDisabled,
  leftIcon,
  rightIcon,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading}
    >
      {isLoading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
```

### Component Variants with CVA (class-variance-authority)

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles — always applied
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 text-gray-700',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-md gap-2',
        lg: 'h-12 px-6 text-base rounded-lg gap-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);
```

---

## Component Hierarchy

Build in this order (dependencies first):

```
1. Primitives
   Tokens → Typography → Color → Spacing → Icons

2. Base Components
   Button → Input → Checkbox → Radio → Toggle → Badge → Avatar

3. Compound Components
   FormField → Select → Combobox → DatePicker → Modal → Toast

4. Layout Components
   Stack → Grid → Container → Sidebar → Navbar

5. Feature Components (product-specific, not in shared lib)
   UserCard → PricingTable → NotificationFeed
```

---

## Figma Organization

### File Structure
```
🎨 Design System
  └─ 📄 _Tokens          (color, spacing, type, radius)
  └─ 📄 _Icons           (all icon components)
  └─ 📄 Foundations      (typography, color palette, grid)
  └─ 📄 Components       (all UI components)
  └─ 📄 Patterns         (forms, cards, navigation patterns)

📱 Product Design
  └─ 📄 [Feature Name]   (actual product screens)
```

### Component Structure in Figma
- Use **auto layout** on everything — no magic numbers
- **Component properties** for variants (not separate frames)
- **Expose nested instances** for slots (icons, avatars inside buttons)
- Name layers semantically: `Button/Primary/Medium` not `Rectangle 42`

---

## Design-to-Code Handoff

### Tools
| Tool | Best For |
|------|----------|
| Figma → CSS variables | Manual token sync |
| Style Dictionary | Token transformation (JSON → CSS/JS/iOS/Android) |
| Theo (by Salesforce) | Alternative token transformer |
| Chromatic + Storybook | Visual regression testing |
| Supernova | Design token sync from Figma |

### Style Dictionary Setup
```javascript
// style-dictionary.config.js
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'ds',
      buildPath: 'src/styles/',
      files: [{ destination: 'tokens.css', format: 'css/variables' }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'src/',
      files: [{ destination: 'tokens.js', format: 'javascript/es6' }],
    },
  },
};
```

---

## Documentation

Every component needs:
1. **Purpose** — what it's for (and what it's NOT for)
2. **Usage examples** — do/don't side by side
3. **Props table** — all props, types, defaults
4. **Accessibility** — keyboard behavior, ARIA roles
5. **Interactive playground** — live in Storybook

Use **Storybook** for component documentation and visual testing.

---

## Governance

- **Who can add components?** — define the process (proposal → review → build → release)
- **Versioning** — semver: breaking changes = major, new components = minor, fixes = patch
- **Deprecation** — announce → warn in code → remove after 2 major versions
- **Contribution guide** — how engineers outside the design system team can contribute

---

## Output Format

Deliver:
1. **Token architecture** — primitive → semantic → component layers
2. **Component inventory** — what to build and in what order
3. **Component code** — with variants, accessibility, and TypeScript types
4. **Figma organization guide** — file structure and naming conventions
5. **Documentation template** — Storybook story and usage guide

## Questions to Ask

1. What tech stack is the frontend built on (React, Vue, Svelte)?
2. Do you use Tailwind or CSS-in-JS?
3. Do you have an existing Figma file or starting fresh?
4. What components already exist that need to be systematized?
5. Do you need multi-brand or white-label support (multiple token themes)?

## Related Skills

- `micro-interactions` — Add interaction states to design system components
- `accessibility` — Bake a11y into every component
- `frontend-design` — Implement the system in a real product
- `design-taste-frontend` — Aesthetic decisions for the system
- `data-visualization` — Chart components as part of the system
