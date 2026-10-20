from PIL import Image

im = Image.open('qa/deck-assets/compare.png')
# crop the table area
crop = im.crop((350, 600, 2400, 1400))
crop.save('product/deck/compare_table_crop.png')
print("Saved compare_table_crop.png")
