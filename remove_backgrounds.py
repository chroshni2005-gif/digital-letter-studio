from pathlib import Path
from rembg import remove
from PIL import Image

# Folder containing your decoration images
INPUT_FOLDER = Path("static/decorations")

# Process common image formats
extensions = {".png", ".jpg", ".jpeg", ".webp"}

for image_path in INPUT_FOLDER.iterdir():

    if image_path.suffix.lower() not in extensions:
        continue

    try:
        print(f"Processing: {image_path.name}")

        # Open image
        image = Image.open(image_path).convert("RGBA")

        # Remove background
        result = remove(image)

        # Save as PNG with transparency
        output_path = image_path.with_suffix(".png")
        result.save(output_path, "PNG")

        # If original wasn't PNG, remove the old file
        if image_path != output_path:
            image_path.unlink()

        print(f"✓ Done: {output_path.name}")

    except Exception as e:
        print(f"✗ Error with {image_path.name}: {e}")

print("\nAll images processed!")