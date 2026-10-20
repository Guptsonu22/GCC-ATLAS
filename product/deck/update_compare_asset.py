import shutil
from PIL import Image

src = r"C:\Users\Sonu\.gemini\antigravity-ide\brain\2493dc3b-4d6d-4e5c-92e5-b9f3fbc61252\compare_workspace_verified_1792502055059.png"
dst = r"qa\deck-assets\compare.png"
backup = r"qa\deck-assets\compare-old-buggy.png"

# backup old
shutil.copyfile(dst, backup)
# copy new
shutil.copyfile(src, dst)
print("Updated qa/deck-assets/compare.png with verified capture")

im = Image.open(dst)
print("New compare.png size:", im.size)
# crop around table header to verify
crop = im.crop((350, 400, 2400, 1100))
crop.save("product/deck/compare_verified_crop.png")
print("Saved compare_verified_crop.png")
