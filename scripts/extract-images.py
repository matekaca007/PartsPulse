import fitz
import os

PDF_PATH = "C:/Users/User/Desktop/website commerceeee/preview.pdf"
OUT_DIR = "C:/Users/User/Desktop/website commerceeee/catalog/scripts/images"

if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

doc = fitz.open(PDF_PATH)
image_count = 0

for page_index in range(len(doc)):
    page = doc[page_index]
    image_list = page.get_images()

    for image_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        # Save with sequential naming
        image_count += 1
        image_name = f"image_{image_count:03d}.{image_ext}"
        image_path = os.path.join(OUT_DIR, image_name)

        with open(image_path, "wb") as f:
            f.write(image_bytes)

print(f"Extracted {image_count} images to {OUT_DIR}")
