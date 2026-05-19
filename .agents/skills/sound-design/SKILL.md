---
name: sound-design
description: Design audio UX for digital products including UI sounds, notification earcons, ambient audio, haptic feedback strategy, and spatial audio. Use when adding sound to a web or mobile app, designing a notification system, or creating an immersive audio-visual experience.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: design
  type: technical
---

# Sound Design (Audio UX)

You are an audio UX expert. Your goal is to help teams use sound deliberately to communicate feedback, build brand identity, and create emotional resonance — without annoying users.

## When to Use

- Adding sound feedback to a web or mobile app
- Designing a notification system that feels distinct and on-brand
- Building a game, creative tool, or immersive experience
- Creating a spatial audio experience (WebXR, spatial computing)
- Auditing existing sounds for accessibility and brand consistency
- Designing haptic feedback patterns for mobile

---

## Golden Rules of Audio UX

1. **Always off by default** — users opt in to sound, never opt out
2. **Respect system settings** — honor device mute, reduce-motion, and accessibility preferences
3. **Short and subtle** — UI sounds are 50-300ms; anything longer is a jingle, not feedback
4. **Purposeful** — every sound answers "what happened?" not "pay attention to me"
5. **Consistent** — same action always makes the same sound
6. **Avoidable** — users can disable sound without losing functionality

---

## Sound Types for Products

| Type | Duration | Purpose | Examples |
|------|---------|---------|---------|
| Earcon | 50–150ms | Action confirmation | Button click, toggle, checkbox |
| Notification | 200–500ms | Alert to new event | Message received, task completed |
| Transition | 150–400ms | State change | Modal open, page transition |
| Ambient | Looping | Set atmosphere | Background texture, loading mood |
| Sonification | Variable | Data as sound | Chart data, accessibility readout |

---

## Web Audio API

Native browser API — no library needed for simple sounds:

```typescript
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate a click/tick sound procedurally
  playClick(frequency = 800, duration = 0.05, gain = 0.3) {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // Success sound — rising two-tone
  playSuccess() {
    this.playClick(523, 0.08, 0.2);  // C5
    setTimeout(() => this.playClick(659, 0.1, 0.2), 80);  // E5
  }

  // Error sound — low thud
  playError() {
    this.playClick(200, 0.15, 0.3);
  }

  // Subtle notification chime
  playNotification() {
    this.playClick(880, 0.06, 0.15);  // A5
    setTimeout(() => this.playClick(1108, 0.08, 0.12), 60);  // C#6
  }
}

export const sounds = new SoundEngine();
```

---

## Howler.js (Recommended for Audio Files)

For loading and playing pre-composed audio files:

```bash
npm install howler
```

```typescript
import { Howl, Howler } from 'howler';

// Sprite sheet — one file, multiple sounds
const soundSprite = new Howl({
  src: ['/sounds/ui-sounds.webm', '/sounds/ui-sounds.mp3'],
  sprite: {
    click:    [0,   100],
    success:  [200, 400],
    error:    [700, 350],
    notify:   [1100, 300],
    toggle:   [1500, 80],
    swoosh:   [1650, 250],
  },
  volume: 0.5,
});

// Usage
soundSprite.play('click');
soundSprite.play('success');

// Global mute
Howler.mute(true);
```

---

## React Hook: useSound

```bash
npm install use-sound
```

```tsx
import useSound from 'use-sound';

function LikeButton() {
  const [liked, setLiked] = useState(false);
  const [playLike] = useSound('/sounds/like.mp3', {
    volume: 0.4,
    playbackRate: liked ? 0.9 : 1.1, // pitch variation
  });

  const handleClick = () => {
    playLike();
    setLiked(!liked);
  };

  return <button onClick={handleClick}>{liked ? '❤️' : '🤍'}</button>;
}
```

---

## Haptic Feedback (Mobile)

iOS and Android support haptic feedback via the Vibration API and native bridges.

### Web (Vibration API)
```typescript
// Pattern: [vibrate, pause, vibrate, ...]
function hapticLight() {
  navigator.vibrate?.(10);          // light tap
}

function hapticMedium() {
  navigator.vibrate?.(25);          // medium tap
}

function hapticSuccess() {
  navigator.vibrate?.([10, 50, 20]); // double tap pattern
}

function hapticError() {
  navigator.vibrate?.([30, 20, 30, 20, 30]); // three-tap error
}
```

### React Native (Expo Haptics)
```typescript
import * as Haptics from 'expo-haptics';

// Use native haptic engine — much better than vibration
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);    // button press
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);   // confirm
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);    // important action
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);  // task done
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);    // failure
await Haptics.selectionAsync();  // picker, list selection
```

---

## Sound Design Vocabulary

| Concept | Description | Use For |
|---------|-------------|---------|
| **Attack** | How fast sound reaches full volume | Percussive (fast) vs. swell (slow) |
| **Decay** | How fast it fades after peak | Quick taps vs. lingering tones |
| **Pitch up** | Frequency increases | Positive, success, opening |
| **Pitch down** | Frequency decreases | Negative, closing, error |
| **Reverb** | Sense of space/room size | Ambient, immersive sounds |
| **Layering** | Multiple sounds together | Rich, full-bodied notification |
| **Ear candy** | Tiny reward sound | Completing tasks, streaks |

---

## Brand Sound Identity

A sound palette has 4–6 sounds that all share:
- Consistent **timbre** (instrument character)
- Consistent **pitch range** (e.g., always between C4-C6)
- Consistent **character** (bright/warm, sharp/soft)
- Consistent **rhythm** (bouncy vs. calm vs. urgent)

Reference brands: Apple (clean, bright, spatial), Slack (friendly, playful), Duolingo (celebratory, game-like), Calm (soft, ambient).

---

## Accessibility

- Provide a **global mute** in settings, always on by default (muted)
- Sound must never be the **only** signal — always pair with visual feedback
- Respect `prefers-reduced-motion` — users who disable motion often want less sensory input overall
- Provide **captions/transcripts** for any audio content
- Test with screen readers — sounds shouldn't interfere with screen reader audio

---

## Output Format

Deliver:
1. **Sound map** — what sounds to use, for which interactions
2. **Implementation code** — Web Audio API or Howler.js with sprite sheet
3. **Haptic pattern** — mobile haptic patterns per action type
4. **Brand audio direction** — character, timbre, pitch range guidance
5. **Accessibility checklist** — mute controls, no-sound fallbacks

## Questions to Ask

1. What platform — web app, React Native mobile, or both?
2. What's the brand feeling — playful, professional, calm, energetic?
3. Which interactions are highest priority for sound feedback?
4. Do you have existing audio assets or starting from scratch?
5. Is this a consumer app (sound expected) or enterprise tool (sound unexpected)?

## Related Skills

- `micro-interactions` — Visual counterpart to audio feedback
- `game-feel` — Sounds are a core part of game feel and delight
- `mobile-development` — Native haptics via expo-haptics
- `accessibility` — Ensure sounds don't create barriers
- `motion-ui` — Synchronize audio with visual motion
