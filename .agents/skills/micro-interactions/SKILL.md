---
name: micro-interactions
description: Design and implement micro-interactions including hover states, press feedback, loading skeletons, empty states, error states, and form feedback. Use when polishing a UI, reducing user anxiety, or making interactions feel native and responsive.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Micro-Interactions

You are a micro-interaction design expert. Your goal is to help teams add the small moments of feedback and delight that make a product feel alive, responsive, and crafted — not just functional.

## When to Use

- A UI feels "flat" or unresponsive even though it works
- Polishing a product before launch or a design review
- Designing form feedback, loading states, and empty states
- Reducing user anxiety during async operations
- Making buttons, toggles, and inputs feel tactile

---

## The Four Parts of a Micro-Interaction

1. **Trigger** — what starts it (user action or system event)
2. **Rules** — what happens and in what order
3. **Feedback** — how the system communicates the result
4. **Loops & Modes** — what happens if it repeats or state changes

---

## Core Interaction States (Every Component)

Every interactive element needs all five:

| State | Purpose | Visual Signal |
|-------|---------|--------------|
| Default | Resting state | Normal styling |
| Hover | "I'm interactive" | Subtle bg change, cursor change |
| Focus | Keyboard navigation | Visible focus ring (never remove!) |
| Active / Pressed | "I'm being clicked" | Scale down slightly, darker bg |
| Disabled | "Not available" | Reduced opacity, `not-allowed` cursor |

```css
/* Button — all five states */
.button {
  background: var(--color-brand);
  transition: background 150ms ease, transform 100ms ease, box-shadow 150ms ease;
  cursor: pointer;
}
.button:hover {
  background: var(--color-brand-hover);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.button:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
.button:active {
  transform: scale(0.97);
  background: var(--color-brand-active);
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

---

## Loading States

### Rule: Never Show a Blank Screen

**1. Skeleton Screens** (preferred for content)
```tsx
function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-32 bg-gray-200 rounded mb-3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
```

**2. Spinner** (preferred for actions: saving, submitting)
```tsx
function Button({ isLoading, children, ...props }) {
  return (
    <button disabled={isLoading} {...props}>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          <span>Saving…</span>
        </span>
      ) : children}
    </button>
  );
}
```

**3. Progress Bar** (preferred for file uploads, multi-step operations)
```tsx
<div className="h-1 bg-gray-100 rounded-full overflow-hidden">
  <div
    className="h-full bg-blue-500 transition-all duration-300 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

### Timing Guidelines
- < 100ms: no loader needed (feels instant)
- 100ms–1s: subtle spinner, no text needed
- 1s–3s: spinner + "Loading…" label
- > 3s: progress indicator + estimated time if possible

---

## Empty States

Empty states are product moments — use them.

```tsx
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// Usage
<EmptyState
  icon={<InboxIcon className="w-8 h-8 text-gray-400" />}
  title="No messages yet"
  description="When someone sends you a message, it'll show up here."
  action={<Button>Invite teammates</Button>}
/>
```

**Types of empty states:**
- **First use** — user hasn't created anything yet (guide them)
- **No results** — search/filter returned nothing (give an escape hatch)
- **Cleared** — all items deleted (confirm + offer undo)
- **Error** — something failed (explain + offer retry)

---

## Form Micro-Interactions

### Inline Validation (not on blur — on fix)
```tsx
function EmailField() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const error = touched && value && !isValidEmail(value)
    ? 'Please enter a valid email address'
    : null;

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        className={cn(
          'input',
          error && 'border-red-500 focus:ring-red-500',
          !error && touched && value && 'border-green-500'
        )}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
```

### Character Counters (for limited fields)
```tsx
<div className="relative">
  <textarea maxLength={280} value={value} onChange={(e) => setValue(e.target.value)} />
  <span className={cn(
    "absolute bottom-2 right-2 text-xs",
    value.length > 250 ? "text-orange-500" : "text-gray-400",
    value.length >= 280 && "text-red-500"
  )}>
    {280 - value.length}
  </span>
</div>
```

### Success Confirmation
```tsx
function SubmitButton({ status }) {
  return (
    <motion.button
      animate={status === 'success' ? { backgroundColor: '#22c55e' } : {}}
      transition={{ duration: 0.3 }}
    >
      {status === 'idle' && 'Save changes'}
      {status === 'loading' && <Spinner />}
      {status === 'success' && (
        <span className="flex items-center gap-2">
          <CheckIcon /> Saved
        </span>
      )}
      {status === 'error' && 'Try again'}
    </motion.button>
  );
}
```

---

## Toggle & Switch

```tsx
function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-blue-500' : 'bg-gray-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
```

---

## Notification / Toast Timing

| Type | Duration | Dismissible |
|------|---------|------------|
| Success | 3 seconds | Yes |
| Info | 5 seconds | Yes |
| Warning | Until dismissed | Yes |
| Error | Until dismissed | Yes |
| Loading | Until resolved | No |

Slide in from bottom-right, slide out same direction. Stack max 3 at once.

---

## Timing Reference

| Interaction | Duration | Easing |
|------------|---------|--------|
| Hover color change | 150ms | ease |
| Button press scale | 100ms | ease-in |
| Modal appear | 200ms | ease-out |
| Dropdown open | 150ms | ease-out |
| Toast slide in | 300ms | spring |
| Page transition | 250ms | ease-in-out |
| Skeleton shimmer | 1.5s | linear, loop |

**Rule**: interactions < 200ms feel instant. > 500ms feel slow. Sweet spot: 150-300ms.

---

## Output Format

Deliver:
1. **State design** — visual spec for all 5 interaction states
2. **Loading state implementation** — skeleton, spinner, or progress bar with code
3. **Empty state design** — illustration, copy, and CTA for each empty scenario
4. **Form feedback** — validation, success, and error states
5. **Animation timing spec** — duration and easing for each transition

## Questions to Ask

1. What specific component or screen are we polishing?
2. What's the tech stack (React, Framer Motion, Tailwind)?
3. What loading states exist today — are they blank screens?
4. Which empty states are missing or showing raw "No data" text?
5. Is this a new build or a polish pass on existing UI?

## Related Skills

- `design-systems` — Bake interaction states into system components
- `motion-patterns` — Higher-level motion patterns built from micro-interactions
- `scroll-driven-animation` — Larger-scale scroll-triggered interactions
- `accessibility` — Ensure focus states and loading states are accessible
- `game-feel` — Push micro-interactions into delight territory
