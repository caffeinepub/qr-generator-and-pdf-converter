# QR Generator and PDF Converter

## Current State
New project with no existing application files.

## Requested Changes (Diff)

### Add
- Home page with hero section, features overview, and call-to-action
- Tools section with 5 tools:
  1. QR Code Maker – generate QR codes from URLs, text, or images
  2. PDF Converter – convert uploaded content to PDF
  3. PDF to Image – convert PDF pages to downloadable images
  4. Text to PDF – convert plain text input to PDF
  5. Image to PDF – merge multiple images into a single PDF
- Review/feedback button on each tool (modal with star rating + comment)
- Download and Share buttons for generated QR codes and PDF files
- Contact section with a contact form
- Mobile-friendly responsive navigation (Home, Tools, Contact)
- Reviews stored in backend per tool

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: store reviews per tool (toolId, rating, comment, timestamp)
2. Backend: expose submitReview and getReviews queries
3. Frontend: Home page with hero, features grid, tool cards
4. Frontend: Tools page with all 5 tool UIs (QR generation via qrcode.js, PDF via jsPDF, PDF-to-image via pdf.js)
5. Frontend: Review modal on each tool
6. Frontend: Download + Share functionality
7. Frontend: Contact form section
8. Frontend: Responsive navbar
