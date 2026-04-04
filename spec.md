# QR Generator and PDF Converter

## Current State
The site is a live SaaS platform with:
- 5 browser-based tools (QR Code Maker, PDF Converter, PDF to Image, Text to PDF, Image to PDF)
- Review/feedback system (Motoko backend)
- Floating Side Games sidebar (right edge, always visible) with:
  - Flappy Bird 3D (FlappyBird3D.tsx, FlappyBird3DGame.tsx, SandboxMode.tsx)
  - Night Centipede Hunt (NightCentipedeHunt.tsx)
- Welcome overlay, click effects, logo, AdSense meta, Analytics
- SideGames.tsx handles the sidebar panel, game cards, and lazy-loaded game overlays
- App.tsx has no direct game references — SideGames.tsx is mounted at the bottom

## Requested Changes (Diff)

### Add
- **StreetDriftLegends.tsx** — New 3D open-world driving game using React Three Fiber + Three.js
  - BMW M5 car model (procedural geometry, body reflections, lights, interior)
  - 5 map locations: City Downtown, Highway, Mountain Road, Desert Area, Night City
  - Weather: Sunny, Night, Rain, Fog
  - Dynamic day/night cycle with automatic street lights
  - Driving physics: acceleration, braking, drifting, suspension, skid marks
  - Police chase mode with AI police cars, flashing lights, sirens
  - NPC traffic with AI lane-following behavior
  - Simulated multiplayer (AI ghost cars with name labels)
  - Challenges: Time Trial, Drift Challenge, Speed Challenge, Checkpoint Race, Traffic Escape
  - Camera: First Person (cockpit) and Third Person (rear follow)
  - Web Audio engine: engine sounds, tire screech, police siren, ambient
  - Motion blur, depth of field, anti-aliasing, soft shadows, reflections
  - Speedometer HUD, mode selector, camera switch, clean modern UI
  - Mobile-compatible touch controls (virtual steering, gas/brake)
- **Game thumbnail** — `/assets/generated/street-drift-legends-thumb.dim_400x225.jpg`
- **SideGames.tsx** — Add StreetDriftLegendsCard and lazy import for the new game
- **App.tsx** — No changes needed; SideGames mounts the new card automatically

### Modify
- **SideGames.tsx** — Add StreetDriftLegends lazy import, state, card component, Suspense overlay, and divider between Night Centipede and new card

### Remove
- Nothing removed

## Implementation Plan
1. Generate game thumbnail image
2. Create `src/frontend/src/games/StreetDriftLegends.tsx` — full React Three Fiber game
3. Update `src/frontend/src/components/SideGames.tsx` — add import, state, card, and overlay for the new game
