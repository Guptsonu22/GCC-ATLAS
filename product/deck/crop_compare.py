from PIL import Image

im = Image.open('qa/deck-assets/compare.png')
print("compare.png size:", im.size)
# crop the top header of compare table
# 2880 x 1800
# let's save a crop of the comparison table header
crop = im.crop((200, 300, 1800, 800))
crop.save('product/deck/compare_crop.png')
print("Saved compare_crop.png")
