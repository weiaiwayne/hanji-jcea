#!/usr/bin/env python3
"""Extract plain text from a PDF for the JCEA AI pipelines.

Usage: extract_pdf.py <path-to-pdf> [max_chars]
Prints extracted text to stdout (UTF-8).
"""
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: extract_pdf.py <pdf> [max_chars]", file=sys.stderr)
        return 2
    path = sys.argv[1]
    max_chars = int(sys.argv[2]) if len(sys.argv) > 2 else 60000

    text_parts = []
    try:
        import pdfplumber

        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t:
                    text_parts.append(t)
                if sum(len(p) for p in text_parts) >= max_chars:
                    break
    except Exception:
        # fall back to pypdf if pdfplumber fails on this file
        try:
            from pypdf import PdfReader

            reader = PdfReader(path)
            for page in reader.pages:
                t = page.extract_text() or ""
                if t:
                    text_parts.append(t)
                if sum(len(p) for p in text_parts) >= max_chars:
                    break
        except Exception as e:
            print(f"extraction failed: {e}", file=sys.stderr)
            return 1

    sys.stdout.write("\n\n".join(text_parts)[:max_chars])
    return 0


if __name__ == "__main__":
    sys.exit(main())
