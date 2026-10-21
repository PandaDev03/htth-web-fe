# Luffy website mascot

Approved concept: `master.png`. Image source sheets: `directions.png`, `reactions.png`.
Artwork generated with built-in image_gen, transparent background enabled. Exact prompts are in `prompts.json`.

## Website integration

`src/features/home/components/OceanWelcomeHero.tsx` renders Luffy above the homepage title at 128px on small screens and 160px from the small breakpoint upward.

The hero's **Tải Game Ngay** link chooses one random expression when a hover/focus interaction begins:
`blink`, `sparkle`, `heart`, `wink`, `bashful`, or `delighted`.
It holds that expression while either pointer hover or keyboard focus remains, then returns to cursor tracking. Touch pointer entry does not create a persistent hover state. The download route remains `/download`.

`src/shared/components/mascot/PageMascot.tsx` is a local adaptation of nilbuild/page-mascot with a controlled `reaction` prop for external controls. Its upstream MIT license is included alongside it. Application dependencies are unchanged.

The component also supports eight-direction pointer tracking, a center dead zone, click reactions, four-click dizzy feedback, keyboard activation, and reduced-motion handling for squash animation. Pointer coordinates stay outside React state; state changes only when the direction cell changes. Effects, timers and animation are cleaned up on unmount.

## Standalone preview

Open `public/mascots/luffy-preview.html` directly, or visit `/mascots/luffy-preview.html` on the existing Vite dev server.
This separate inspection page requests no third-party resources and exposes all 18 frames, three display sizes, and light/dark/checker backgrounds.

## Rebuild

From the Web FE repository:

```sh
npm ci --prefix scripts/mascot
node scripts/mascot/build-luffy.mjs
```

Tool dependencies are isolated in `scripts/mascot`.
The build segments connected alpha regions across the full source image (rather than assuming precise AI gutters), preserves reaction symbols, normalizes torso size and baseline, aligns the torso band, and exports two static 1080x1080 WebP atlases with 360x360 cells. It also writes `verification.json`. Source images are preserved.

## Assets and cell order

- `public/mascots/luffy-directions.webp`: up-left, up, up-right; left, center, right; down-left, down, down-right.
- `public/mascots/luffy-reactions.webp`: blink, heart, sparkle; surprised, wink, bashful; sleepy, dizzy, delighted.

Local component usage:

```tsx
import { PageMascot } from "@/shared/components/mascot/PageMascot";

<PageMascot
  directions="/mascots/luffy-directions.webp"
  reactions="/mascots/luffy-reactions.webp"
  reaction={downloadReaction}
  size={160}
  label="Luffy"
/>
```

## Verification

- `verification.json`: WebP geometry, alpha, edge clearance, torso alignment.
- `browser-checks.json`: standalone preview interactions.
- `home-integration-checks.json`: all six CTA expressions through hover and focus, overlapping input states, keyboard navigation, pointer tracking, click/dizzy recovery, touch, reduced motion, route navigation and responsive layouts from 360px to 1920px. Browser checks mock API responses; mascot artwork and application components are real.
- Targeted ESLint and application TypeScript checks pass. No production build was run.

Format reference: https://github.com/nilbuild/page-mascot
