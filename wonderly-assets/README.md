# Wonderly Brand Assets

Ready-to-use assets extracted and generated from the Wonderly Brand Identity Board for website and Electron app.

## Logos

- **logo-main.png** — Full logo with planet icon, wordmark, and tagline "EXPLORE • LEARN • GROW" (transparent background)
- **logo-horizontal.png** — Horizontal logo (icon + wordmark, transparent background)
- **logo-reversed.png** — Reversed logo (white wordmark + icon on black background) for dark themes

## Icons (transparent, square)

Pure planet icon centered on transparent square background:
- icon-16.png, icon-32.png, icon-48.png, icon-64.png, icon-128.png, icon-256.png, icon-512.png
- **icon-full.png** — High-resolution original aspect ratio version

## App Icons (blue rounded square background)

Matching the style from the brand board. Ideal for Electron, desktop, and mobile app icons:
- appicon-16.png ... appicon-1024.png (standard sizes including 192 for PWA, 512, etc.)

## Favicons

- **favicon.ico** — Multi-size ICO (16/32/48)
- favicon-16.png, favicon-32.png, favicon-48.png

## Usage Tips

### Website
- Use `logo-horizontal.png` or `logo-main.png` in header
- `favicon.ico` in `<link rel="icon" href="/favicon.ico">`
- For dark mode, use `logo-reversed.png` or pure icons

### Electron App
- Set `icon` in BrowserWindow to `appicon-256.png` or higher
- Package with electron-builder using the appicon-* files
- For macOS/Windows tray or dock: use the appicon series

All PNGs have transparent backgrounds where appropriate.
