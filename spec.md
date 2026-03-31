# QR Generator and PDF Converter

## Current State
Full-stack app with React/TypeScript frontend and Motoko backend. The site has five browser-based tools: QR Code Maker, PDF Converter, PDF to Image, Text to PDF, Image to PDF. Layout includes a Hero section, Tools grid, Why Choose Us, How It Works, Feature Strip, Contact form, SEO accordion, and Footer. Styling uses OKLCH CSS variables, Plus Jakarta Sans + Bricolage Grotesque fonts, Tailwind CSS, and shadcn/ui components. Current background is a light gray (`--background: 0.965 0.012 245`, roughly #F3F6F9), sections alternate between `bg-background`, `bg-card`, and `bg-muted`.

## Requested Changes (Diff)

### Add
- Light blue to white gradient for the page background (#e0f2ff → #ffffff, top to bottom)
- Soft box-shadow on tool cards and section cards
- Prominent solid-blue buttons with darker-blue hover state

### Modify
- `index.css`: Update `--background` to pure white (1 0 0), set `body` background to the light-blue-to-white gradient using a CSS linear-gradient. Ensure `--foreground` is near-black for readability. Update `--muted` to a very light off-white so alternating sections remain visible on the gradient.
- `App.tsx`: Replace section background classes (`bg-background`, `bg-muted`, `bg-card`) so sections feel cohesive on the light gradient. Hero section should use the gradient (remove its own bg, let the page gradient show). Cards (tools, why choose us, how-it-works steps, feature strip, accordion items) should be pure white with soft shadow and rounded corners. Increase vertical padding/spacing between sections for an airy layout.
- `App.tsx`: Buttons — ensure `Button` uses the solid primary blue with a slightly darker blue on hover. No outline secondary button changes needed beyond current.
- `tailwind.config.js`: Add or update `boxShadow.card` for softer, more prominent shadow. Ensure gradient utilities are usable if needed.

### Remove
- Heavy animations — keep only simple `opacity+y` entrance animations. Remove or reduce any `scale` or staggered delay animations for performance.

## Implementation Plan
1. Update `index.css`:
   - Set `--background` and `--card` both to white (1 0 0)
   - Add `body { background: linear-gradient(to bottom, #e0f2ff, #ffffff); background-attachment: fixed; }` (or equivalent using CSS variables)
   - Keep `--foreground` as near-black; ensure `--muted-foreground` is dark enough (≥ 0.45 lightness in OKLCH) for body text on white
   - Set `--muted` to a very subtle light blue-gray so `bg-muted` sections are distinguishable
2. Update `App.tsx`:
   - Change outer `div` background from `bg-background` to transparent (let body gradient show)
   - Remove or lighten section-level background overrides (hero, tools, why-choose-us, how-it-works, contact, SEO sections) so the page gradient is visible throughout
   - Alternating sections can use a slightly different white/off-white card-like wrapper for visual separation
   - Cards: add `shadow-md` or custom shadow, `rounded-2xl`, white background explicitly where needed
   - Buttons: verify `Button` primary variant is solid blue; add `hover:bg-blue-700` or equivalent Tailwind class if default hover is not prominent enough
   - Increase `py-20` to `py-24` on major sections for breathing room
   - Simplify motion animations — keep `opacity+y` only, remove scale transforms
3. Update `tailwind.config.js`:
   - Update `boxShadow.card` to a softer, more noticeable value: `0 4px 16px 0 rgba(30,136,229,0.10), 0 1px 4px 0 rgba(0,0,0,0.06)`
   - Update `boxShadow.card-hover` to be more prominent on hover
