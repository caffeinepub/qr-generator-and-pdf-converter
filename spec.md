# QR Generator and PDF Converter

## Current State
Live site with 5 browser-based tools: QR Code Maker, PDF Converter, PDF to Image, Text to PDF, Image to PDF. Hero section has generic heading "Create & Convert Easily" with a short paragraph. Tool cards use "Open Tool" buttons. Has a basic "How It Works" section (3 steps) and a feature strip (3 items). Footer has Tools, Navigation, Contact columns but no About Us / Privacy Policy / Terms pages. No "Why Choose Us" section. No SEO content section. index.html has no meaningful title, description, or OG meta tags.

## Requested Changes (Diff)

### Add
- index.html: `<title>`, meta description, meta keywords, og:title, og:description, og:type, og:url tags for SEO
- Hero: descriptive paragraph with 4 bullet points (generate QR from text/URLs/images; convert text/images to PDF; no downloads; 100% browser-based)
- "Why Choose Us" section with 5 feature cards: Fast processing, Easy to use, 100% privacy, Free tools, Works on all devices
- SEO content section with 3 expandable or static text blocks: "What is a QR Code Generator?", "What is a PDF Converter?", "Benefits of Using Online Tools"
- Footer links: About Us, Contact, Privacy Policy, Terms and Conditions (as anchor links or modal pages)

### Modify
- Hero h1: change to "Free QR Code Generator & PDF Converter Online – Fast, Secure & Easy"
- Tool card buttons: QR Code Maker → "Generate QR Now"; PDF Converter → "Convert to PDF"; PDF to Image → "Convert PDF to Image"; Text to PDF → "Convert Text to PDF"; Image to PDF → "Convert Image to PDF"
- "How It Works" steps: update text to Step 1: Upload or Enter Data, Step 2: Convert Instantly, Step 3: Download or Share
- Overall spacing, fonts, and layout refinements for premium look

### Remove
- Nothing removed

## Implementation Plan
1. Update `index.html`: add meaningful title, meta description, meta keywords, OG meta tags
2. Update `App.tsx`:
   a. Hero h1 text update
   b. Add description bullet points below existing paragraph
   c. Update TOOLS button labels per tool (use per-tool button text, not generic)
   d. Update HOW_IT_WORKS step descriptions to match requested text
   e. Add WHY_CHOOSE_US data array (5 items with icons)
   f. Insert "Why Choose Us" section after tools grid or after how-it-works
   g. Add SEO_CONTENT array (3 items: What is QR, What is PDF Converter, Benefits)
   h. Add SEO content section before footer
   i. Update footer: add About Us, Privacy Policy, Terms and Conditions as modal-based or inline pages
   j. Improve overall spacing, typography, and layout for AdSense-ready premium look
