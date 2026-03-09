"""
sync_images.py
Downloads all images from a publicly shared Google Drive folder
into data/images/ with no API key required.
"""

import os
import re
import requests

FOLDER_ID  = os.environ.get("DRIVE_FOLDER_ID", "1P_ovMrHrJGvChuXiVMz5CDt0UFC79feZ")
OUTPUT_DIR = os.path.join("data", "images")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def get_file_list(folder_id: str) -> list[dict]:
    """Scrape the public Drive folder page to get file ids and names."""
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    # Extract file entries: ["filename.jpg", ... , "FILE_ID", ...]
    # Drive embeds file metadata as JSON-like arrays in the page source
    entries = re.findall(
        r'\["([^"]+\.(?:jpg|jpeg|png|webp|gif))",null,"([A-Za-z0-9_-]{25,})"',
        resp.text,
        re.IGNORECASE,
    )

    # Also try the reverse order pattern Drive sometimes uses
    if not entries:
        entries_rev = re.findall(
            r'"([A-Za-z0-9_-]{25,})"[^"]*"([^"]+\.(?:jpg|jpeg|png|webp|gif))"',
            resp.text,
            re.IGNORECASE,
        )
        entries = [(name, fid) for fid, name in entries_rev]

    files = [{"name": name, "id": fid} for name, fid in entries]

    # Deduplicate by id
    seen = set()
    unique = []
    for f in files:
        if f["id"] not in seen:
            seen.add(f["id"])
            unique.append(f)

    return unique


def download_file(file_id: str, dest_path: str) -> bool:
    """Download a single Drive file by ID."""
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    session = requests.Session()

    resp = session.get(url, stream=True, timeout=60)

    # Handle the virus-scan warning page for large files
    token = None
    for key, value in resp.cookies.items():
        if key.startswith("download_warning"):
            token = value
            break

    if token:
        resp = session.get(
            url, params={"confirm": token}, stream=True, timeout=60
        )

    if resp.status_code != 200:
        return False

    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=32768):
            f.write(chunk)
    return True


def main():
    print("🖼️   Starting Google Drive image sync…")
    print(f"    Folder ID : {FOLDER_ID}")
    print(f"    Output    : {OUTPUT_DIR}/")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("\n  Fetching file list…")
    try:
        files = get_file_list(FOLDER_ID)
    except Exception as e:
        print(f"  ❌  Could not fetch folder listing: {e}")
        return

    if not files:
        print("  ⚠️  No image files found in folder.")
        print("      Make sure the folder is shared as 'Anyone with the link can view'.")
        return

    print(f"  Found {len(files)} image(s)\n")

    downloaded = 0
    skipped    = 0

    for f in files:
        dest = os.path.join(OUTPUT_DIR, f["name"])

        # Skip if already downloaded (saves bandwidth on re-runs)
        if os.path.exists(dest):
            print(f"  ⏭  Skipped (already exists): {f['name']}")
            skipped += 1
            continue

        print(f"  ↓  Downloading: {f['name']} …", end=" ", flush=True)
        ok = download_file(f["id"], dest)
        if ok:
            size_kb = os.path.getsize(dest) // 1024
            print(f"✓ ({size_kb} KB)")
            downloaded += 1
        else:
            print("❌ failed")

    print(f"\n  Downloaded : {downloaded}")
    print(f"  Skipped    : {skipped}")
    print("\n✅  Image sync complete!")


if __name__ == "__main__":
    main()
