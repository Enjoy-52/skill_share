#!/usr/bin/env python3
"""Compress a PDF under a target size by recompressing embedded images (PyMuPDF)."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


def _mb(n: int) -> float:
    return n / (1024 * 1024)


def _ensure_pymupdf():
    try:
        import fitz  # noqa: F401
    except ImportError:
        print("ERROR: pymupdf not installed. Run: pip install pymupdf", file=sys.stderr)
        sys.exit(2)


def compress_once(src: Path, out: Path, jpeg_quality: int, image_max_side: int) -> int:
    import fitz

    doc = fitz.open(src)
    try:
        for page in doc:
            for img in page.get_images(full=True):
                xref = img[0]
                try:
                    pix = fitz.Pixmap(doc, xref)
                except Exception:
                    continue
                if pix.n - pix.alpha > 3:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                if image_max_side and max(pix.width, pix.height) > image_max_side:
                    scale = image_max_side / max(pix.width, pix.height)
                    pix = fitz.Pixmap(
                        pix,
                        max(1, int(pix.width * scale)),
                        max(1, int(pix.height * scale)),
                        None,
                    )
                if pix.alpha:
                    pix = fitz.Pixmap(pix, 0)
                try:
                    img_bytes = pix.tobytes("jpeg", jpg_quality=jpeg_quality)
                    page.replace_image(xref, stream=img_bytes)
                except Exception:
                    pass
                pix = None
        out.parent.mkdir(parents=True, exist_ok=True)
        # Write to temp then replace, so partial failures don't wipe --overwrite targets
        tmp = out.with_suffix(out.suffix + ".tmp")
        doc.save(tmp, garbage=4, deflate=True, clean=True)
        tmp.replace(out)
        return out.stat().st_size
    finally:
        doc.close()


# (jpeg_quality, max_side); max_side 0 = no downscale
ATTEMPTS: list[tuple[int, int]] = [
    (95, 0),
    (92, 0),
    (90, 0),
    (85, 0),
    (75, 0),
    (65, 2000),
    (55, 1600),
    (45, 1400),
    (40, 1200),
    (35, 1000),
    (30, 800),
]


def main() -> int:
    _ensure_pymupdf()

    p = argparse.ArgumentParser(description="Compress PDF under a size cap")
    p.add_argument("input", type=Path, help="Source PDF path")
    p.add_argument("--max-mb", type=float, default=4.2, help="Max size in MB (default 4.2)")
    p.add_argument("--out", type=Path, default=None, help="Output path")
    p.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite the input file (default: write <stem>_compressed.pdf)",
    )
    args = p.parse_args()

    src: Path = args.input.expanduser().resolve()
    if not src.is_file():
        print(f"ERROR: file not found: {src}", file=sys.stderr)
        return 1
    if src.suffix.lower() != ".pdf":
        print(f"ERROR: not a PDF: {src}", file=sys.stderr)
        return 1

    target = int(args.max_mb * 1024 * 1024)
    if args.overwrite:
        out = src
    elif args.out:
        out = args.out.expanduser().resolve()
    else:
        out = src.with_name(f"{src.stem}_compressed.pdf")

    src_size = src.stat().st_size
    print(f"input={src}")
    print(f"output={out}")
    print(f"size_in={src_size} ({_mb(src_size):.2f} MB)")
    print(f"target_max={target} ({args.max_mb} MB)")

    if src_size <= target:
        if out.resolve() != src.resolve():
            shutil.copy2(src, out)
        print(f"OK already under target; wrote={out} size={out.stat().st_size}")
        return 0

    best_size: int | None = None
    best_q: int | None = None
    best_side: int | None = None

    for q, max_side in ATTEMPTS:
        try:
            size = compress_once(src, out, q, max_side)
        except Exception as e:
            print(f"WARN attempt q={q} maxside={max_side or '-'}: {e}", file=sys.stderr)
            continue
        print(f"attempt q={q} maxside={max_side or '-'} -> {_mb(size):.2f} MB")
        best_size, best_q, best_side = size, q, max_side
        if size <= target:
            # Prefer highest quality still under target: stop at first success
            # (attempts are ordered high→low quality)
            print(
                f"OK under target q={q} maxside={max_side or '-'} "
                f"size={size} ({_mb(size):.2f} MB) path={out}"
            )
            return 0

    if best_size is None:
        print("ERROR: all compression attempts failed", file=sys.stderr)
        return 1

    print(
        f"ERROR: still over target after best attempt "
        f"q={best_q} maxside={best_side or '-'} "
        f"size={best_size} ({_mb(best_size):.2f} MB) path={out}",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
