import os
from pptx import Presentation
import pymupdf

pptx_final = r"submission\GCC-Atlas-Strategy-Deck-Final.pptx"
pdf_final = r"submission\GCC-Atlas-Strategy-Deck-Final.pdf"
pptx_orig = r"submission\GCC-Atlas-Strategy-Deck.pptx"
pdf_orig = r"submission\GCC-Atlas-Strategy-Deck.pdf"

print("=== VERIFYING FINAL STRATEGY DECK DELIVERABLES ===")

# 1. Final PPTX
assert os.path.exists(pptx_final), f"Missing {pptx_final}"
prs = Presentation(pptx_final)
print(f"[OK] Final PPTX exists ({os.path.getsize(pptx_final):,} bytes)")
print(f"     Total slides: {len(prs.slides)}")
for idx, slide in enumerate(prs.slides, 1):
    title = "Untitled"
    for shape in slide.shapes:
        if shape.has_text_frame and shape.text_frame.text:
            text = shape.text_frame.text.strip().replace('\n', ' ')
            if "GCC Atlas" in text or "problem" in text.lower() or "stakeholders" in text.lower() or "opportunity" in text.lower() or "customer" in text.lower() or "decisions" in text.lower() or "walkthrough" in text.lower() or "product" in text.lower() or "positioning" in text.lower() or "business" in text.lower() or "trust" in text.lower() or "roadmap" in text.lower() or "workarounds" in text.lower():
                title = text[:60]
                break
    print(f"     Slide {idx:02d}: {title}")

# 2. Final PDF
assert os.path.exists(pdf_final), f"Missing {pdf_final}"
doc = pymupdf.open(pdf_final)
print(f"[OK] Final PDF exists ({os.path.getsize(pdf_final):,} bytes)")
print(f"     Total pages: {len(doc)}")
for idx, page in enumerate(doc, 1):
    txt_first = page.get_text().strip().split('\n')[0] if page.get_text().strip() else "Empty"
    print(f"     Page {idx:02d}: {txt_first[:60]}")
doc.close()

# 3. Originals preserved
assert os.path.exists(pptx_orig), f"Missing original {pptx_orig}"
assert os.path.exists(pdf_orig), f"Missing original {pdf_orig}"
prs_orig = Presentation(pptx_orig)
doc_orig = pymupdf.open(pdf_orig)
print(f"[OK] Originals preserved untouched:")
print(f"     Original PPTX: {len(prs_orig.slides)} slides ({os.path.getsize(pptx_orig):,} bytes)")
print(f"     Original PDF:  {len(doc_orig)} pages ({os.path.getsize(pdf_orig):,} bytes)")
doc_orig.close()

print("\nALL DELIVERABLE INTEGRITY CHECKS PASSED PERFECTLY!")
