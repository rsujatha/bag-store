from PIL import Image, ImageChops

img = Image.open("/vercel/share/v0-project/public/images/kasvi-logo.jpeg")

# Convert to RGB if needed
img = img.convert("RGB")

# Create a black background image of same size
bg = Image.new("RGB", img.size, (0, 0, 0))

# Find the bounding box of non-black pixels (with some tolerance)
diff = ImageChops.difference(img, bg)
# Add a threshold to handle near-black pixels
threshold = 30
diff = diff.point(lambda p: 255 if p > threshold else 0)
bbox = diff.getbbox()

if bbox:
    # Add a small padding around the crop
    padding = 10
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(img.width, bbox[2] + padding)
    bottom = min(img.height, bbox[3] + padding)
    
    cropped = img.crop((left, top, right, bottom))
    cropped.save("/vercel/share/v0-project/public/images/kasvi-logo.jpeg", "JPEG", quality=95)
    print(f"Original size: {img.size}")
    print(f"Cropped size: {cropped.size}")
    print(f"Bounding box: {bbox}")
    print("Logo cropped successfully!")
else:
    print("Could not detect content bounds")
