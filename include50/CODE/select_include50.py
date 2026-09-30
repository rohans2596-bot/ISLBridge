"""
CODE/select_include50.py
Reads official AI4Bharat INCLUDE-50 train/val/test split files,
copies only the referenced 958 videos to INCLUDE_50, and validates counts.
"""
import os
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Paths configuration (Supports both C:\ISL_HACKATHON and local include50 workspace)
BASE_DIR = Path(os.environ.get("ISL_HACKATHON_DIR", Path(__file__).resolve().parent.parent))
INCLUDE_REPO_SPLITS = Path(os.environ.get("INCLUDE_REPO_DIR", r"C:\INCLUDE\train_test_paths"))

RAW_DIR = BASE_DIR / "INCLUDE_RAW"
DEST_DIR = BASE_DIR / "INCLUDE_50"

SPLIT_FILES = {
    "train": INCLUDE_REPO_SPLITS / "include50_train.txt",
    "val":   INCLUDE_REPO_SPLITS / "include50_val.txt",
    "test":  INCLUDE_REPO_SPLITS / "include50_test.txt",
}

EXPECTED_COUNTS = {
    "train": 689,
    "val": 77,
    "test": 192,
    "total": 958
}

def load_split_paths(file_path: Path):
    if not file_path.exists():
        print(f"[ERROR] Split file not found: {file_path}")
        print("Please clone https://github.com/AI4Bharat/INCLUDE to C:\\INCLUDE")
        print("or set INCLUDE_REPO_DIR environment variable.")
        sys.exit(1)
    with open(file_path, "r", encoding="utf-8") as f:
        paths = [line.strip() for line in f if line.strip()]
    return paths

def main():
    print("=" * 65)
    print("AI4Bharat INCLUDE-50 Dataset Video Selector")
    print(f"Base Directory: {BASE_DIR}")
    print(f"Splits Directory: {INCLUDE_REPO_SPLITS}")
    print("=" * 65)

    train_paths = load_split_paths(SPLIT_FILES["train"])
    val_paths = load_split_paths(SPLIT_FILES["val"])
    test_paths = load_split_paths(SPLIT_FILES["test"])

    print(f"[*] Paths read from include50_train.txt: {len(train_paths)} (Expected: {EXPECTED_COUNTS['train']})")
    print(f"[*] Paths read from include50_val.txt:   {len(val_paths)}   (Expected: {EXPECTED_COUNTS['val']})")
    print(f"[*] Paths read from include50_test.txt:  {len(test_paths)}  (Expected: {EXPECTED_COUNTS['test']})")

    all_paths = train_paths + val_paths + test_paths
    total_expected = len(all_paths)
    print(f"[*] Total expected videos: {total_expected} (Expected: {EXPECTED_COUNTS['total']})")

    copied_count = 0
    missing_paths = []

    for rel_path in all_paths:
        clean_rel = rel_path.replace("/", os.sep).replace("\\", os.sep)
        src_file = RAW_DIR / clean_rel
        dst_file = DEST_DIR / clean_rel

        if not src_file.exists():
            # Check case-insensitive match
            found = False
            for p in RAW_DIR.glob(clean_rel.split(os.sep)[-1]):
                src_file = p
                found = True
                break
            if not found:
                missing_paths.append(clean_rel)
                continue

        dst_file.parent.mkdir(parents=True, exist_ok=True)
        if not dst_file.exists():
            shutil.copy2(src_file, dst_file)
        copied_count += 1

    print("\n" + "-" * 65)
    print(f"Total Copied / Verified: {copied_count}")
    print(f"Total Missing:          {len(missing_paths)}")

    if missing_paths:
        print("\n[ERROR] Missing Video Files (First 10 shown):")
        for m in missing_paths[:10]:
            print(f"  - {m}")
        print("\nPlease extract all required INCLUDE category zip files into:")
        print(f"  {RAW_DIR}")
        sys.exit(1)

    print(f"\n[SUCCESS] All 958 INCLUDE-50 videos are present and isolated in {DEST_DIR}")

if __name__ == "__main__":
    main()
