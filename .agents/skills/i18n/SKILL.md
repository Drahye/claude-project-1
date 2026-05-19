---
name: i18n
description: Design and implement internationalization (i18n) and localization (l10n) for products including translation workflows, locale-aware formatting, and RTL support. Use when expanding to new markets or adding multi-language support.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Internationalization (i18n) & Localization (l10n)

You are an expert in building multilingual, locale-aware products. Your goal is to help teams add i18n support correctly from the start — or retrofit it without a rewrite.

## When to Use

- Adding a second language to an existing product
- Expanding to a new country or market
- Making dates, currencies, and numbers locale-aware
- Supporting right-to-left (RTL) languages (Arabic, Hebrew)
- Setting up a translation workflow with external translators

## Key Concepts

- **i18n (Internationalization)** — engineering: making the product capable of supporting multiple locales
- **l10n (Localization)** — translation and adaptation: making the product feel native to a specific locale
- **Locale** — language + region: `en-US`, `fr-FR`, `ar-SA`
- **Translation key** — identifier for a string: `common.save_button`
- **Plural rules** — languages differ in plural forms (English: 1 singular, 2+ plural; Russian: 4 forms)

## Library Selection

### Web (React)
| Library | Best For |
|---------|----------|
| next-intl | Next.js apps (recommended) |
| react-i18next | Any React app, mature, large ecosystem |
| FormatJS / react-intl | ICU message format, complex plurals |

### Mobile (React Native)
| Library | Best For |
|---------|----------|
| i18next + react-i18next | Cross-platform (also works in RN) |
| expo-localization | Expo locale detection |

### Backend (Node.js)
| Library | Best For |
|---------|----------|
| i18next | Universal JS, same library as frontend |
| node-polyglot | Simple key-value, lightweight |

## Implementation Pattern (Next.js + next-intl)

### File Structure
```
messages/
  en.json
  fr.json
  ar.json
src/
  i18n.ts
  middleware.ts   # locale detection + routing
```

### Message File
```json
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  },
  "checkout": {
    "title": "Checkout",
    "item_count": "{count, plural, one {# item} other {# items}}",
    "total": "Total: {amount}"
  }
}
```

### Usage in Component
```tsx
import { useTranslations, useFormatter } from 'next-intl';

export function CheckoutSummary({ count, totalCents }: Props) {
  const t = useTranslations('checkout');
  const format = useFormatter();

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('item_count', { count })}</p>
      <p>{t('total', {
        amount: format.number(totalCents / 100, { style: 'currency', currency: 'USD' })
      })}</p>
    </div>
  );
}
```

## Locale-Aware Formatting

Never hardcode number, date, or currency formatting — always use the Intl API:

```javascript
// Numbers
new Intl.NumberFormat('fr-FR').format(1234567)     // "1 234 567"
new Intl.NumberFormat('de-DE').format(1234567)     // "1.234.567"

// Currency
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(29.99)  // "$29.99"
new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(29.99)  // "29,99 €"

// Dates
new Intl.DateTimeFormat('en-US').format(new Date())  // "5/19/2026"
new Intl.DateTimeFormat('de-DE').format(new Date())  // "19.5.2026"

// Relative time
new Intl.RelativeTimeFormat('en').format(-3, 'day')  // "3 days ago"
```

## Plural Rules

Use ICU message format to handle all plural forms:
```json
{
  "unread_messages": "{count, plural, =0 {No messages} one {# message} other {# messages}}"
}
```

## RTL (Right-to-Left) Support

For Arabic, Hebrew, Persian, Urdu:

```css
/* Use logical properties instead of directional */
/* Instead of: margin-left, padding-right, text-align: left */
/* Use: */
margin-inline-start: 1rem;
padding-inline-end: 1rem;
text-align: start;
```

```html
<!-- Set direction on html element -->
<html lang="ar" dir="rtl">
```

In React/Next.js:
```tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

## Translation Workflow

### For Small Teams (< 5 languages)
1. Export JSON files to Google Sheets or Localise.biz
2. Translators fill in columns
3. Import back as JSON
4. Review with native speakers before shipping

### For Larger Scale
- Use a Translation Management System (TMS): Phrase, Lokalise, Crowdin
- Connect TMS to your repo via CI/CD — strings auto-sync
- Machine translation (DeepL) for first draft, human review for final

### Continuous Localization
- Extract new strings automatically from code (i18next-parser, next-intl CLI)
- Alert translators when new strings are added
- Block deploy if strings are untranslated (or fall back to English with warning)

## Content That Needs Special Handling

- **Dates/times** — always use Intl, always store UTC
- **Currency** — display in local currency where possible
- **Phone numbers** — format with libphonenumber
- **Names** — don't assume "First Last" order (Japan is "Last First")
- **Addresses** — format varies by country (use address-formatter libraries)
- **Legal copy** — often needs country-specific legal review, not just translation
- **Images with text** — need localized versions

## Output Format

Deliver:
1. **Library recommendation** — with setup code
2. **Message file structure** — JSON schema for translation keys
3. **Component example** — showing t() usage, plurals, and formatting
4. **RTL checklist** — CSS logical property audit
5. **Translation workflow** — how strings go from code to translator to ship

## Questions to Ask

1. Which languages and locales do you need to support first?
2. Do any target locales use RTL (Arabic, Hebrew)?
3. What framework are you using (Next.js, React, React Native)?
4. Do you have translators in-house or will you use a service?
5. Are there locale-specific legal or compliance requirements?

## Related Skills

- `frontend-design` — Ensure layouts flex for text expansion (German text is ~30% longer than English)
- `mobile-development` — Mobile i18n with expo-localization
- `privacy-compliance` — Locale-specific privacy and consent requirements
- `legal-copy` — Translated and locally adapted legal documents
