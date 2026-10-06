#!/usr/bin/env python3
"""Create a simple multi-page demo manuscript PDF for seeding.

Usage: make_demo_pdf.py <out.pdf> <title> <body-text-file>
"""
import sys
from fpdf import FPDF


def main() -> int:
    out, title, body_file = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(body_file, encoding="utf-8") as f:
        body = f.read()

    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.multi_cell(0, 8, title)
    pdf.ln(4)
    pdf.set_font("times", size=11)
    for para in body.split("\n\n"):
        pdf.multi_cell(0, 5.5, para.strip())
        pdf.ln(2)
    pdf.output(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
