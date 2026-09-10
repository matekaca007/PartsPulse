import fitz
import os
import json

PDF_PATH = "C:/Users/User/Desktop/website commerceeee/preview.pdf"
OUT_DIR = "C:/Users/User/Desktop/website commerceeee/catalog/scripts/images"
MAP_OUT = "C:/Users/User/Desktop/website commerceeee/catalog/scripts/image_map.json"

doc = fitz.open(PDF_PATH)

# We will collect SKUs and their Y-coordinates per page
# Then we will collect Images and their Y-coordinates per page
# Then we match them up based on the closest Y-coordinate

image_map = {}
image_count = 0

for page_index in range(len(doc)):
    page = doc[page_index]
    
    # 1. Extract text words and find SKUs
    # get_text("words") returns (x0, y0, x1, y1, "word", block_no, line_no, word_no)
    words = page.get_text("words")
    skus_on_page = []
    
    for w in words:
        text = w[4].strip()
        # SKU pattern: starts with LMBR
        if text.startswith("LMBR") and len(text) >= 9:
            # Sometimes variants like LMBRWS009 - A are split, we just use the first part as base, 
            # but wait, let's just record the exact text we found or match it later.
            # We use the bounding box center Y
            y_center = (w[1] + w[3]) / 2
            skus_on_page.append({"sku": text, "y": y_center})
            
    # 2. Extract images with bounding boxes
    # get_image_info() returns list of dicts with 'bbox': (x0,y0,x1,y1), 'xref': int
    image_info_list = page.get_image_info(xrefs=True)
    
    # Also we need to extract the actual image bytes using the xref
    # However, get_image_info might return duplicate xrefs if the image is shown multiple times.
    # We will iterate through image_info_list
    
    for img_info in image_info_list:
        xref = img_info["xref"]
        bbox = img_info["bbox"]
        img_y_center = (bbox[1] + bbox[3]) / 2
        
        # We need to extract the image bytes
        base_image = doc.extract_image(xref)
        if not base_image:
            continue
            
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Find the closest SKU on this page
        closest_sku = None
        min_dist = float('inf')
        
        for s in skus_on_page:
            dist = abs(s["y"] - img_y_center)
            if dist < min_dist:
                min_dist = dist
                closest_sku = s["sku"]
                
        # If we found a matching SKU within a reasonable Y distance (e.g. 50 pixels)
        if closest_sku and min_dist < 60:
            # We found a match
            image_count += 1
            image_name = f"mapped_{image_count:03d}_{closest_sku}.{image_ext}"
            image_path = os.path.join(OUT_DIR, image_name)
            
            with open(image_path, "wb") as f:
                f.write(image_bytes)
                
            image_map[closest_sku] = image_name

print(f"Mapped {len(image_map)} images to SKUs.")
with open(MAP_OUT, "w") as f:
    json.dump(image_map, f, indent=2)
