import sharp from 'sharp';

const inputPath = '/vercel/share/v0-project/public/images/kasvi-logo.jpeg';
const outputPath = '/vercel/share/v0-project/public/images/kasvi-logo.jpeg';

async function cropLogo() {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`Original size: ${metadata.width}x${metadata.height}`);

  // Extract raw pixel data to find the bounding box of non-black content
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const threshold = 30;

  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Check if pixel is non-black (above threshold)
      if (r > threshold || g > threshold || b > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX > minX && maxY > minY) {
    // Add small padding
    const padding = 10;
    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const cropWidth = Math.min(width, maxX + padding) - left;
    const cropHeight = Math.min(height, maxY + padding) - top;

    console.log(`Crop region: left=${left}, top=${top}, width=${cropWidth}, height=${cropHeight}`);

    await sharp(inputPath)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .jpeg({ quality: 95 })
      .toFile(outputPath + '.tmp');

    // Replace original with cropped version
    const fs = await import('fs');
    fs.renameSync(outputPath + '.tmp', outputPath);

    console.log(`Cropped size: ${cropWidth}x${cropHeight}`);
    console.log('Logo cropped successfully!');
  } else {
    console.log('Could not detect content bounds');
  }
}

cropLogo().catch(console.error);
