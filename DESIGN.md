# Scholr — Design System v1.0

## Design Philosophy

Scholr is not designed like school software. It feels closer to Notion, Linear, Stripe Dashboard, Teachable, and Headspace.

The product must feel: **Calm. Intelligent. Premium. Fast. Trustworthy. Human.**

Every screen communicates clarity before functionality. Users understand what matters within 3 seconds of opening any page.

### Brand Personality
- Professional, Warm, Reassuring, Modern, Educational, Intelligent

### Avoid
- Corporate SaaS feel
- Government/legacy school software appearance
- Dense tables, cluttered dashboards

## Typography

**Display font:** Playfair Display — editorial, premium, serif authority  
**Body/UI font:** Inter — clean, precise, screen-optimised

### Type Scale
| Token | Size | Font | Usage |
|---|---|---|---|
| Display XL | 72px | Playfair Display | Landing hero |
| Display L | 56px | Playfair Display | Section heroes |
| Display M | 48px | Playfair Display | Major callouts |
| Heading XL | 40px | Inter 700 | Page titles |
| Heading L | 32px | Inter 700 | Section headings |
| Heading M | 28px | Inter 600 | Card headings |
| Heading S | 24px | Inter 600 | Sub-sections |
| Body XL | 20px | Inter 400 | Lead copy |
| Body L | 18px | Inter 400 | Body copy |
| Body M | 16px | Inter 400 | Default |
| Body S | 14px | Inter 400 | UI labels |
| Caption | 12px | Inter 500 | Metadata |

### Line Heights
- Display: 110% (1.1)
- Headings: 120% (1.2)
- Body: 150% (1.5)

## Color System

### Strategy: Committed
Indigo is the identity color, carrying 40-50% of the surface.

### Primary
- Indigo: `#4F46E5` / `oklch(46% 0.22 264)`
- Indigo Hover: `#4338CA` / `oklch(42% 0.22 264)`
- Indigo Light: `#EEF2FF` / `oklch(96% 0.015 264)`

### Semantic
- Success: `#059669` / `oklch(52% 0.17 162)`
- Success Light: `#D1FAE5` / `oklch(95% 0.015 162)`
- Warning (Gold/Pro): `#D97706` / `oklch(62% 0.15 65)`
- Warning Light: `#FEF3C7` / `oklch(97% 0.015 65)`
- Danger: `#DC2626` / `oklch(47% 0.22 27)`
- Danger Light: `#FEE2E2` / `oklch(97% 0.01 27)`
- Info: `#0284C7` / `oklch(52% 0.18 235)`
- Info Light: `#E0F2FE` / `oklch(96% 0.015 235)`

### Neutrals
- Text Primary: `#0F172A` / `oklch(13% 0.015 264)`
- Text Secondary: `#475569` / `oklch(40% 0.01 264)`
- Text Tertiary: `#94A3B8` / `oklch(65% 0.008 264)`
- Border: `#E2E8F0` / `oklch(91% 0.008 264)`
- Surface: `#F8FAFC` / `oklch(98.5% 0.005 264)`
- Background: `#FFFFFF`

### Dark Mode
- Background: `#0D1117` / `oklch(9% 0.01 264)`
- Surface: `#161B22` / `oklch(13% 0.012 264)`
- Text: `#F0F6FF` / `oklch(96% 0.008 264)`

## Shadow System
```
Small:   0 1px 2px rgba(0,0,0,0.04)
Medium:  0 8px 24px rgba(15,23,42,0.08)
Large:   0 20px 48px rgba(15,23,42,0.12)
Modal:   0 30px 60px rgba(15,23,42,0.20)
```

## Spacing
4px base unit: 8, 12, 16, 24, 32, 48, 64, 80, 96px

## Border Radius
- Cards / Modals: 16px
- Inputs: 10px
- Primary buttons (pill): 28px
- Badges/chips: 20px
- Avatars: 50%

## Button System
| Type | Height | Radius | Background |
|---|---|---|---|
| Primary | 52px | 28px | Indigo |
| Secondary | 52px | 28px | White + border |
| Ghost | 52px | 28px | Transparent |
| Danger | 52px | 28px | Red |

Button states: Default / Hover / Active (scale 0.98) / Disabled / Loading / Success

## Form System
- Input height: 52px
- Input radius: 10px
- States: Default / Focused (indigo ring) / Filled / Error / Disabled

## Card System
Cards are the primary organisational pattern.

| Card Type | Contents |
|---|---|
| Analytics | KPI number, Trend, Mini chart, Action |
| Feature | Icon, Title, Description, CTA |
| Student | Photo, Name, Class, Attendance summary |
| Teacher | Photo, Subjects, Response rate |
| School | Logo, Plan, Health Score |

Hover: lift 4px translateY, 200ms ease-out, Medium shadow
Max per row: 4 desktop / 2 tablet / 1 mobile

## Badge System
- **Pro**: Gold/amber background
- **AI Generated**: Indigo tint
- **Absent**: Danger red
- **Overdue**: Warning amber
- **Paid**: Success green
- **Unread**: Indigo dot

## Motion
### Easing
```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)     — UI interactions
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)    — on-screen movement
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)     — drawers
```

### Micro-interactions
| Interaction | Property | Duration |
|---|---|---|
| Card hover | translateY(-4px) + shadow | 200ms ease-out |
| Button press | scale(0.98) | 160ms ease-out |
| Notification slide | translateY(0) from top | 150ms ease-out |
| Page transition | fade + translateY(8px) | 200ms ease-out |
| Tab switch | clip-path / opacity | 200ms ease-out |
| Stagger (cards) | opacity + translateY | 50ms per item |

### Rules (Emil Kowalski)
- Only animate `transform` and `opacity` (GPU-only)
- Never animate `ease-in` for UI elements (feels sluggish)
- Keep UI animations under 300ms
- No bounce, no elastic, no flash
- Gate hover animations behind `@media (hover: hover) and (pointer: fine)`

## Accessibility
- WCAG AA minimum
- Color contrast: 4.5:1
- Keyboard navigation throughout
- Visible focus states (2px indigo outline, 2px offset)
- Screen reader labels on all interactive elements
- Charts require text alternatives

## Responsive Breakpoints
- 320px+: Mobile (1 card per row)
- 768px+: Tablet (2 cards per row)
- 1024px+: Desktop (3-4 cards per row)
- 1440px+: Wide

Touch targets minimum: 44x44px

## Portal-specific Systems

### Parent Portal
- Bottom mobile nav: Home / Messages / Updates / Reports / Profile
- WhatsApp-style conversation bubbles
- Weekly Intelligence Report: Apple Fitness Summary aesthetic

### Teacher Portal
- Floating Quick Actions: Mark attendance / Create homework / Send announcement / Generate report
- AI features: identical pattern: Header > Prompt Input > Output Area > Edit/Copy/Save/Regenerate > AI Disclosure

### Admin Portal
- Mission control layout
- Top row: School Health Score / Students / Teachers / Revenue
- Second row: Attendance trends / Engagement / Fee collection / Message activity

## Banned Patterns
- Side-stripe border accents (>1px) on cards
- Gradient text (background-clip: text)
- Glassmorphism as decoration
- Hero-metric template (big number + gradient accent)
- Identical card grids repeated endlessly
- Modals as first thought for any action
- Spinners for page loads (use skeleton screens only)
