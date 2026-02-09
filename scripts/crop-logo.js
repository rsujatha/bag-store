import sharp from 'sharp';
import fs from 'fs';

const imageUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-02-09%20at%2009.31.03-VrTwPTAtD2CKGt62t8eBkjw3s2zlR7.jpeg';

async function cropLogo() {
  // Fetch the image from the blob URL
  console.log('Fetching image from URL...');
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  console.log('Image fetched, buffer size:', inputBuffer.length);

  const image = sharp(inputBuffer);
  const metadata = await image.metadata();
  console.log(`Original size: ${metadata.width}x${metadata.height}`);

  // Get raw pixel data to detect non-black content
  const { data, info } = await sharp(inputBuffer)
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

      if (r > threshold || g > threshold || b > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX > minX && maxY > minY) {
    const padding = 10;
    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const cropWidth = Math.min(width, maxX + padding) - left;
    const cropHeight = Math.min(height, maxY + padding) - top;

    console.log(`Crop region: left=${left}, top=${top}, width=${cropWidth}, height=${cropHeight}`);

    const croppedBuffer = await sharp(inputBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .jpeg({ quality: 95 })
      .toBuffer();

    // Write to local file so we can verify
    fs.writeFileSync('kasvi-logo-cropped.jpeg', croppedBuffer);
    console.log('Cropped image saved, size:', croppedBuffer.length, 'bytes');
    
    // Also write base64 so we can use it
    const base64 = croppedBuffer.toString('base64');
    console.log('BASE64_START');
    console.log(base64);
    console.log('BASE64_END');
  } else {
    console.log('Could not detect content bounds');
  }
}

cropLogo().catch(console.error);
