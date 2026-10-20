import os
from PIL import Image

assets_dir = 'qa/deck-assets'
print("Listing deck-assets:")
for f in os.listdir(assets_dir):
    p = os.path.join(assets_dir, f)
    if f.endswith('.png'):
        im = Image.open(p)
        print(f"{f}: size={im.size}, file_bytes={os.path.getsize(p)}")
