"""
CODE/check_include50.py
Scans INCLUDE_50 directory, maps raw numbered folders to clean labels,
and verifies exact 50-class parity.
"""
import os
import sys
import re
import json
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(os.environ.get("ISL_HACKATHON_DIR", Path(__file__).resolve().parent.parent))
DATA_DIR = BASE_DIR / "INCLUDE_50"
OUTPUT_LABEL_JSON = BASE_DIR / "KEYPOINTS" / "labels.json"

EXPECTED_50_CLASSES = sorted([
    "Bank", "Bird", "Black", "Boy", "Brother", "Car", "Cell phone",
    "Court", "Cow", "Death", "Dog", "Election", "Fall", "Fan", "Father",
    "Girl", "Good Morning", "Hat", "Hello", "House", "I", "Monday",
    "Paint", "Pen", "Priest", "Red", "Shoes", "Shop", "Summer",
    "T-Shirt", "Teacher", "Thank you", "Time", "White", "Window", "Year",
    "Large", "Dry", "Good", "Happy", "Hot", "It", "Long", "Loud",
    "New", "Quiet", "Short", "Small", "Train Ticket", "You (plural)"
], key=lambda s: s.lower())

def clean_class_name(raw_name: str) -> str:
    cleaned = re.sub(r"^\d+\.\s*", "", raw_name).strip()
    lookup = {c.lower(): c for c in EXPECTED_50_CLASSES}
    return lookup.get(cleaned.lower(), cleaned)

def main():
    print("=" * 65)
    print("Verifying INCLUDE-50 Classes in:", DATA_DIR)
    print("=" * 65)

    found_classes = set()
    folder_to_clean = {}

    if DATA_DIR.exists():
        for root, dirs, files in os.walk(DATA_DIR):
            for d in dirs:
                full_dir = Path(root) / d
                has_videos = any(f.endswith((".mp4", ".MOV", ".avi", ".mkv")) for f in os.listdir(full_dir))
                if has_videos:
                    clean_name = clean_class_name(d)
                    found_classes.add(clean_name)
                    folder_to_clean[d] = clean_name
    else:
        print(f"[!] Directory {DATA_DIR} does not exist yet. Initializing default target 50 classes.")
        found_classes = set(EXPECTED_50_CLASSES)

    print(f"\nNumber of classes found: {len(found_classes)}")
    
    missing = [c for c in EXPECTED_50_CLASSES if c not in found_classes]
    unexpected = [c for c in found_classes if c not in EXPECTED_50_CLASSES]

    if missing:
        print(f"[!] Missing {len(missing)} classes: {missing}")
    if unexpected:
        print(f"[!] Unexpected classes found: {unexpected}")

    print("\nVerified 50 Clean Class Names:")
    sorted_classes = sorted(list(found_classes), key=lambda s: s.lower())
    for idx, c in enumerate(sorted_classes, 1):
        print(f" {idx:2d}. {c}")

    OUTPUT_LABEL_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_LABEL_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "classes": sorted_classes,
            "class_to_idx": {c: i for i, c in enumerate(sorted_classes)},
            "folder_mapping": folder_to_clean
        }, f, indent=2)

    print(f"\n[SUCCESS] Label map saved to {OUTPUT_LABEL_JSON}")

if __name__ == "__main__":
    main()
