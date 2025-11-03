# Favicon Generation Guide

This guide explains how to generate all required favicon formats from the base SVG.

## Required Formats

1. **favicon.ico** - 16x16, 32x32 (multi-size ICO)
2. **favicon-16x16.png** - 16x16 PNG
3. **favicon-32x32.png** - 32x32 PNG
4. **apple-touch-icon.png** - 180x180 PNG
5. **android-chrome-192x192.png** - 192x192 PNG
6. **android-chrome-512x512.png** - 512x512 PNG
7. **safari-pinned-tab.svg** - Monochrome SVG
8. **favicon.svg** - Modern SVG (already created)

## Tools

### Option 1: Online Tools
- **RealFaviconGenerator** (https://realfavicongenerator.net/)
- Upload `/public/favicon.svg` or use the base design
- Generate all formats
- Download and place in `/public/`

### Option 2: ImageMagick
```bash
# Install ImageMagick
# Then convert SVG to various sizes:

# PNG 16x16
convert -background none -resize 16x16 public/favicon.svg public/favicon-16x16.png

# PNG 32x32
convert -background none -resize 32x32 public/favicon.svg public/favicon-32x32.png

# PNG 180x180 (Apple)
convert -background none -resize 180x180 public/favicon.svg public/apple-touch-icon.png

# PNG 192x192 (Android)
convert -background none -resize 192x192 public/favicon.svg public/android-chrome-192x192.png

# PNG 512x512 (Android)
convert -background none -resize 512x512 public/favicon.svg public/android-chrome-512x512.png

# ICO (multi-size)
convert -background none -resize 16x16 public/favicon.svg public/temp-16.png
convert -background none -resize 32x32 public/favicon.svg public/temp-32.png
convert public/temp-16.png public/temp-32.png public/favicon.ico
rm public/temp-*.png
```

### Option 3: Node.js Script
Use `sharp` or `jimp` to programmatically generate:

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 180, 192, 512];

async function generateFavicons() {
  const svg = fs.readFileSync('public/favicon.svg');
  
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`public/favicon-${size}x${size}.png`);
  }
  
  // Generate ICO (requires additional library)
}
```

## Design Specifications

### Base Design
- **Icon**: Medical cross in circle
- **Colors**: #0F4C75 (primary), white (contrast)
- **Background**: Transparent or solid #0F4C75
- **Size**: 64x64 viewBox (scales to any size)

### Platform-Specific Notes

#### iOS
- 180x180 minimum
- No transparency (use solid background)
- Rounded corners added automatically

#### Android
- 192x192 (mdpi)
- 512x512 (xxxhdpi)
- Can use transparency

#### Windows
- ICO format with multiple sizes
- Use solid background for better visibility

#### Safari
- Safari-pinned-tab: Monochrome SVG
- Single color (black recommended)

## Testing

After generating, test favicons:
1. Browser tabs (Chrome, Firefox, Safari, Edge)
2. Mobile home screens (iOS, Android)
3. Browser bookmarks
4. Desktop shortcuts (Windows, macOS, Linux)

## Current Implementation

The base SVG is available at:
- `/public/favicon.svg`

All other formats need to be generated using one of the methods above.

