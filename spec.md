# QR Generator and PDF Converter – Clean Premium Redesign

## Current State

The site currently has:
- A full-screen `WelcomeSplash` component that plays a multi-note audio chime and shows for 2.5 seconds with floating sparkle particles, logo glow pulse, and a loading bar animation
- A hero section with 2-column layout: left text + bullet list + 2 CTA buttons, right is a `LiveQRPreview` glassmorphism panel with floating QR animation and heavy box-shadow glow
- Floating background blobs (4 large radial-gradient divs with CSS keyframe animations)
- Tools grid with glassmorphism cards (`bg-white/60 backdrop-blur-md`), rounded-3xl, hover lift + blue border glow
- "Why Choose Us" section with glassmorphism cards, whileHover glow box-shadow
- All sections use `motion/react` (framer-motion) for scroll fade-ins and animated gradients
- `ClickEffects` component for ripple + audio on every tap
- Side Games sidebar always visible
- `index.css` has `gradient-text` animated keyframe, `float-blob` keyframes, logo-glow-pulse keyframe, body has gradient background fixed
- Welcome screen gated with `showWelcome` state – entire main site only renders after welcome

## Requested Changes (Diff)

### Add
- Simple, clean hero layout: big heading "Free QR Code Generator & PDF Tools", one-line subheading, single CTA button "Generate QR Code" clearly above fold
- Subtle hover-only lift on tool cards (no glow border on hover)
- Clean "Why Choose Us" cards with simple shadow and subtle lift (no whileHover glow)

### Modify
- **Welcome screen**: Reduce to 1.5 seconds max. Remove audio chime. Remove floating sparkles and loading bar. Keep only a simple centered text + logo with a quick fade-in, then fade-out. No heavy animation.
- **Hero**: Remove the 4-bullet list. Remove the secondary "Contact Us" button. Keep only ONE primary CTA: "Generate QR Code". Simplify layout – keep the `LiveQRPreview` on the right but remove the heavy glow box-shadow from the QR image. Reduce/remove the floating bounce animation on the QR image inside LiveQRPreview.
- **Background blobs**: Remove the fixed floating blob `div`s entirely. Replace with a simple, static clean white/light-blue page background (no animations).
- **Body background**: Change from animated gradient to a plain `#F8FAFC` (near-white) background.
- **Tool cards**: Remove `bg-white/60 backdrop-blur-md` glassmorphism. Replace with plain `bg-white` white background, soft shadow, rounded corners. Keep only subtle hover lift (translateY -2px), no glow border changes on hover.
- **Why Choose Us cards**: Remove glassmorphism. Use plain white cards with `shadow-sm`, `border border-gray-100`, subtle hover lift only.
- **Gradient text animation**: Remove or reduce. Use a static blue color for the subheading highlight instead of animated cycling gradient.
- **CTA buttons**: Remove heavy glow `boxShadow` style. Use clean blue button with only a subtle hover scale (1.02), no glow.
- **ClickEffects**: Keep the ripple but remove audio (or make it optional — audio is distracting on a clean/minimal site). Actually remove the audio component's sound trigger entirely, keep only the visual ripple if possible.
- **Spacing**: Increase section padding where needed to give more breathing room.
- **Font**: Ensure Inter or Poppins is used (can use Google Fonts import via CSS or keep existing Plus Jakarta Sans if it reads clean).

### Remove
- Audio chime from WelcomeSplash
- Floating sparkle particles from WelcomeSplash
- Loading bar animation from WelcomeSplash
- All 4 fixed floating blob background divs
- `float-blob`, `float-blob-2` CSS keyframes (no longer needed)
- `logo-glow-pulse` CSS keyframe from WelcomeSplash logo
- Animated `gradient-text` keyframe – replace with static gradient or plain blue
- The floating `y: [0, -8, 0]` bounce animation on the QR preview image
- Heavy `boxShadow` glow on CTA buttons (keep only default shadow)
- Secondary "Contact Us" button from hero (keep only the main CTA)
- The 4 feature bullet list items in the hero left column
- whileHover `boxShadow` glow from Why Choose Us cards

## Implementation Plan

1. **WelcomeSplash**: Strip to bare minimum. Keep component, set timer to 1500ms. Remove AudioContext sound code. Remove sparkle particles. Remove loading bar motion div. Remove logo-glow animate prop. Just show logo + text with a simple fade-in, fade-out.

2. **Hero section**: Remove bullet list `<ul>`. Remove secondary button. Update heading text to exactly "Free QR Code Generator & PDF Tools". Add a simple one-line subheading. Keep `LiveQRPreview` on the right but remove the floating `animate={{ y: [0, -8, 0] }}` from the QR image, and remove the `boxShadow: '0 0 30px rgba(59,130,246,0.4)'` style from the QR container.

3. **Background**: Remove the 4 blob divs from the JSX. In `index.css`, change `body` background to plain `background: #F8FAFC`.

4. **Tool cards**: Change `className` from `bg-white/60 backdrop-blur-md border ...` to `bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 ...`.

5. **Why Choose Us cards**: Change from glassmorphism + `whileHover` glow to plain `bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1`.

6. **CSS cleanup**: Remove `float-blob`, `float-blob-2`, `logo-glow-pulse` keyframes. Simplify `gradient-text` or replace with static color. Update body background.

7. **ClickEffects**: Remove the audio splash sound from the component, keep only the visual ripple effect.

8. **Button styles**: Remove inline `style={{ boxShadow: ... }}` glow from CTA buttons. Use clean Tailwind shadow only.

9. **Validate**: Typecheck + build must pass.
