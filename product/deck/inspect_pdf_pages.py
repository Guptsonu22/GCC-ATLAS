import os
import fitz  # PyMuPDF

pdf_path = r"submission\GCC-Atlas-Strategy-Deck-Final.pdf"
out_dir = r"product\deck\pdf_pages"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total pages in {pdf_path}: {len(doc)}")

for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    page_img = os.path.join(out_dir, f"page_{i+1:02d}.png")
    pix.save(page_img)
    text = page.get_text()
    first_line = text.strip().split('\n')[0] if text.strip() else "(no text)"
    print(f"Page {i+1:02d}: {page_img} ({pix.width}x{pix.height}) - First text: '{first_line[:50]}'")

doc.close()
print("All pages rendered successfully.")
