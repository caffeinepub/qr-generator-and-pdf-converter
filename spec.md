# QR Generator and PDF Converter - Attractiveness & Graphics Upgrade

## Current State

- Site has blue/white/purple gradient background with floating blobs
- Welcome screen shows 1.5s with light purple/blue text
- Hero section: big heading, live QR preview, CTA button
- 5 tool cards in glassmorphism or white card style
- Why Choose Us: 4 feature cards
- Click/touch effects: purple/blue ripple + sparkle sound
- Side Games sidebar: 3 games (Flappy Bird 3D, Night Centipede Hunt, Street Drift Legends)
- Game files are large (SandboxMode: 3339 lines, StreetDriftLegends: 4113 lines, NightCentipedeHunt: 3203 lines)

## Requested Changes (Diff)

### Add
- More vibrant, premium gradient background with animated particles or subtle aurora effect
- Glassmorphism hero card with depth and glow
- Animated floating icons/orbs in the background
- Neon/glowing section borders and dividers
- Premium hover effects on all cards (3D perspective tilt, glow trails)
- More dramatic welcome screen with animated gradient text
- All 3 games: major graphics overhaul
  - FlappyBird3D/SandboxMode: PBR materials, HDRI sky dome, advanced lighting rigs, particle effects, lens flare, bloom post-processing, more detailed bird mesh, better environment geometry
  - NightCentipedeHunt: volumetric fog, wet/reflective ground, particle blood/gore effects, better shadow maps, improved sky, more dramatic moon/star rendering, enhanced centipede textures and glow
  - StreetDriftLegends: real-time reflections on car body, improved road surface with lane markings, better building facades, animated neon signs on night city, improved weather particle effects, depth of field

### Modify
- Background: upgrade from simple gradient blobs to layered aurora/nebula animated background
- Hero section: more dramatic glassmorphism card, animated gradient headline, pulsing CTA button
- Tool cards: add 3D tilt effect on hover, more vibrant icon gradients, shimmer animation
- SideGames sidebar button: more premium glow and scale animation
- Footer: add subtle gradient and improved visual weight
- All game skyboxes: upgrade to procedural sky with atmospheric scattering
- Game lighting: upgrade to 3-point cinematic lighting rigs with ACES tone mapping and bloom
- Game materials: upgrade to full PBR (metalness, roughness, normal maps simulated via geometry)

### Remove
- Nothing to remove

## Implementation Plan

1. **App.tsx** -- Upgrade background to animated aurora/gradient with floating orbs; improve hero card with glassmorphism depth; add 3D tilt effect to cards; upgrade welcome screen animation; improve footer
2. **ClickEffects.tsx** -- Enhance ripple with more layers and glow
3. **SideGames.tsx** -- Upgrade sidebar button and game cards with more premium look
4. **FlappyBird3DGame.tsx** -- Upgrade lighting (ACES, bloom hints, hemisphere), improved bird model detail, better sky colors, PBR materials on pipes and ground
5. **SandboxMode.tsx** -- Upgrade lighting, sky dome, environment detail, particle effects for fly mode
6. **NightCentipedeHunt.tsx** -- Volumetric fog improvements, better moonlight/star rendering, wet ground shader, improved centipede glow, particle effects
7. **StreetDriftLegends.tsx** -- Car body reflections, improved road materials, animated neon signs for Night City, improved weather particles, motion blur hints, better building details
