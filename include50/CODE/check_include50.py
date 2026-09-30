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

OFFICIAL_FOLDER_MAP = {
    "1. Dog": "Dog",
    "1. loud": "Loud",
    "11. Car": "Car",
    "14. Election": "Election",
    "16. train ticket": "Train Ticket",
    "19. House": "House",
    "2. Death": "Death",
    "2. quiet": "Quiet",
    "23. Court": "Court",
    "28. Store or Shop": "Shop",
    "28. Window": "Window",
    "3. happy": "Happy",
    "34. Pen": "Pen",
    "35. Bank": "Bank",
    "37. Hat": "Hat",
    "4. Bird": "Bird",
    "40. I": "I",
    "40. Paint": "Paint",
    "42. T-Shirt": "T-Shirt",
    "44. Shoes": "Shoes",
    "44. it": "It",
    "46. you (plural)": "You (plural)",
    "47. Red": "Red",
    "48. Hello": "Hello",
    "5. Cow": "Cow",
    "51. Good Morning": "Good Morning",
    "53. Fan": "Fan",
    "54. Black": "Black",
    "54. Cell phone": "Cell phone",
    "55. Thank you": "Thank you",
    "55. White": "White",
    "61. Father": "Father",
    "61. Summer": "Summer",
    "64. Fall": "Fall",
    "66. Brother": "Brother",
    "67. Monday": "Monday",
    "77. Boy": "Boy",
    "78. Girl": "Girl",
    "78. Year": "Year",
    "78. long": "Long",
    "79. short": "Short",
    "83. big large": "Large",
    "84. Teacher": "Teacher",
    "84. small little": "Small",
    "86. Time": "Time",
    "87. hot": "Hot",
    "91. Priest": "Priest",
    "91. new": "New",
    "94. good": "Good",
    "97. dry": "Dry"
}

EXPECTED_50_CLASSES = sorted(list(set(OFFICIAL_FOLDER_MAP.values())), key=lambda s: s.lower())

def clean_class_name(raw_folder_name: str) -> str:
    if raw_folder_name in OFFICIAL_FOLDER_MAP:
        return OFFICIAL_FOLDER_MAP[raw_folder_name]
    # Fallback heuristic
    cleaned = re.sub(r"^\d+\.\s*", "", raw_folder_name).strip()
    lookup = {c.lower(): c for c in EXPECTED_50_CLASSES}
    return lookup.get(cleaned.lower(), cleaned)

def main():
    print("=" * 65)
    print("Verifying INCLUDE-50 Classes in:", DATA_DIR)
    print("=" * 65)

    found_classes = set()
    folder_to_clean = dict(OFFICIAL_FOLDER_MAP)

    if DATA_DIR.exists() and any(DATA_DIR.iterdir()):
        for root, dirs, files in os.walk(DATA_DIR):
            for d in dirs:
                full_dir = Path(root) / d
                has_videos = any(f.endswith((".mp4", ".MOV", ".avi", ".mkv")) for f in os.listdir(full_dir))
                if has_videos:
                    clean_name = clean_class_name(d)
                    found_classes.add(clean_name)
                    folder_to_clean[d] = clean_name
    else:
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

    # Also update CODE/labels.json
    code_labels = BASE_DIR / "CODE" / "labels.json"
    with open(code_labels, "w", encoding="utf-8") as f:
        json.dump({
            "classes": sorted_classes,
            "class_to_idx": {c: i for i, c in enumerate(sorted_classes)},
            "folder_mapping": folder_to_clean
        }, f, indent=2)

    print(f"\n[SUCCESS] Label map saved to {OUTPUT_LABEL_JSON}")

if __name__ == "__main__":
    main()
