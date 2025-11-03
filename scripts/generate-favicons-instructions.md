# Favicon Generation Instructions

The manifest.json currently uses SVG icons. For better browser compatibility, especially for PWA and mobile apps, you should generate PNG versions.

## Quick Fix (Current)

The app currently uses SVG icons which work in modern browsers:
- `/favicon.svg` - Main favicon
- `/assets/svg/prontivus-icon.svg` - App icon

## Recommended: Generate PNG Icons

### Option 1: Online Tool (Easiest)

1. Go to https://realfavicongenerator.net/
2. Upload `/public/favicon.svg`
3. Configure:
   - iOS: 180x180 (no transparency)
   - Android: 192x192 and 512x512
   - Desktop: 16x16, 32x32, 48x48
4. Download generated files
5. Place in `/public/` directory

### Option 2: ImageMagick (Command Line)

```bash
# Install ImageMagick first

# Generate PNG icons from SVG
convert -background none -resize 16x16 public/favicon.svg public/favicon-16x16.png
convert -background none -resize 32x32 public/favicon.svg public/favicon-32x32.png
convert -background none -resize 180x180 public/favicon.svg public/apple-touch-icon.png
convert -background none -resize 192x192 public/favicon.svg public/android-chrome-192x192.png
convert -background none -resize 512x512 public/favicon.svg public/android-chrome-512x512.png

# Generate ICO (multi-size)
convert -background none public/favicon.svg -define icon:auto-resize=64,48,32,16 public/favicon.ico
```

### Option 3: Node.js Script (Automated)

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateIcons() {
  const svg = fs.readFileSync('public/favicon.svg');
  
  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`public/${name}`);
    console.log(`Generated ${name}`);
  }
  
  // Generate ICO
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
  console.log('Generated favicon.ico');
}

generateIcons().catch(console.error);
```

## Update manifest.json

Once PNG files are generated, update `manifest.json`:

```json
{
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/favicon-16x16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Current Status

✅ SVG icons work for development
⚠️ PNG icons recommended for production (especially mobile/PWA)

The current setup uses SVG only, which eliminates the 404 errors but may have limited support on some older devices.

