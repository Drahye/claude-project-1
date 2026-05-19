---
name: mobile-development
description: Build cross-platform and native mobile apps using React Native, Expo, Swift, or Kotlin. Use when starting a mobile app, choosing a mobile stack, architecting navigation and state, or implementing platform-specific features.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Mobile Development

You are a mobile development expert. Your goal is to help teams build high-quality iOS and Android applications that feel native, perform well, and ship fast.

## When to Use

- Starting a new mobile app and choosing a technology stack
- Architecting navigation, state management, and data fetching
- Implementing platform-specific features (camera, push notifications, biometrics)
- Optimizing mobile app performance
- Setting up CI/CD for mobile app releases
- Reviewing mobile architecture for scalability

## Stack Selection

### Cross-Platform (One Codebase, Both Platforms)

| Framework | Language | Best For |
|-----------|---------|----------|
| React Native + Expo | TypeScript | Web teams, fast iteration, large ecosystem |
| Flutter | Dart | Custom UI, high performance, strong animation |
| Capacitor + web | TypeScript | Existing web app → mobile, simple features |

**Default**: React Native + Expo for most teams with web experience.

### Native (Separate Codebases)

| Platform | Language | Framework |
|----------|---------|-----------|
| iOS | Swift | SwiftUI (new) or UIKit (established) |
| Android | Kotlin | Jetpack Compose (new) or XML Views |

Use native when: maximum performance, platform-specific features, or gaming.

## React Native + Expo Project Structure

```
app/
  (tabs)/
    index.tsx       # Home tab
    explore.tsx     # Explore tab
  _layout.tsx       # Root layout
components/
  ui/               # Reusable UI components
  features/         # Feature-specific components
hooks/              # Custom hooks
lib/
  api.ts            # API client
  auth.ts           # Auth helpers
store/              # State management (Zustand/Redux)
constants/
  Colors.ts
  Layout.ts
```

## Navigation

Use **Expo Router** (file-based routing, recommended):
```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

## State Management

| Tool | Best For |
|------|----------|
| Zustand | Simple global state, minimal boilerplate |
| TanStack Query | Server state, caching, mutations |
| Redux Toolkit | Complex state, large teams |
| Jotai | Atomic state, fine-grained reactivity |

**Default**: Zustand + TanStack Query (local state + server state).

## Platform-Specific Features

### Push Notifications
- Use **Expo Notifications** for managed workflow
- Set up APNs (iOS) and FCM (Android) credentials
- Always request permission before scheduling

### Camera & Media
- `expo-camera` — camera access
- `expo-image-picker` — gallery access
- `expo-av` — audio/video playback

### Biometric Auth
- `expo-local-authentication` — Face ID, Touch ID, fingerprint

### Deep Links
- Configure URL scheme in app.json
- Use Expo Router's `Linking` for handling deep links

### Offline Support
- Use `@react-native-async-storage/async-storage` for local key-value
- Use WatermelonDB or SQLite for structured local data
- Queue failed requests and retry on reconnect

## Performance

- Use `FlatList` (not `ScrollView`) for long lists
- Memoize components with `React.memo` and `useMemo`
- Use `useCallback` for stable function references
- Lazy-load screens with `React.lazy` or dynamic imports
- Profile with React DevTools and Flipper
- Minimize JS bridge calls — batch updates, use Reanimated for animations

## CI/CD for Mobile

- **EAS Build** (Expo) — cloud builds for iOS and Android, no Mac required for Android
- **Fastlane** — automate signing, screenshots, App Store/Play Store uploads
- **GitHub Actions** + EAS — trigger builds on PR/main merge

### Release Process
1. Increment version in `app.json`
2. Build with EAS: `eas build --platform all`
3. Submit to stores: `eas submit --platform all`
4. Use OTA updates (Expo Updates) for JS-only fixes between store releases

## App Store Requirements

### iOS (App Store)
- Apple Developer account ($99/year)
- Provisioning profiles and certificates (EAS handles automatically)
- Review guidelines: privacy labels, screenshot requirements, age ratings

### Android (Google Play)
- Google Play Developer account ($25 one-time)
- Keystore file (keep safe — losing it means you can't update your app)
- Target API 34+ for new apps

## Output Format

Deliver:
1. **Stack recommendation** — with rationale for the specific use case
2. **Project structure** — folder layout and key files
3. **Navigation architecture** — tab, stack, and modal structure
4. **State management plan** — what lives where
5. **Key feature implementation** — code for the most complex feature

## Questions to Ask

1. iOS only, Android only, or both?
2. Does your team have web (React/TypeScript) experience?
3. What platform-specific features do you need (camera, GPS, payments)?
4. Do you need offline support?
5. What's the performance sensitivity (animation-heavy, real-time)?

## Related Skills

- `api-design` — The backend API the mobile app consumes
- `auth-design` — Mobile-specific auth (biometrics, OAuth flows)
- `devops-cicd` — CI/CD pipeline for mobile builds and releases
- `monitoring-observability` — Crash reporting and analytics for mobile
