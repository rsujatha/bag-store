"""
sync_images.py
Downloads all images from a publicly shared Google Drive folder
using the Google Drive API v3 with a free API key.
"""

import os
import requests

FOLDER_ID  = os.environ.get("DRIVE_FOLDER_ID", "1P_ovMrHrJGvChuXiVMz5CDt0UFC79feZ")
API_KEY    = os.environ.get("GOOGLE_API_KEY")
OUTPUT_DIR = os.path.join("public", "images")

IMAGE_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif"
}


def get_file_list(folder_id: str, api_key: str) -> list[dict]:
    """List all files in the public Drive folder via API v3."""
    url = "https://www.googleapis.com/drive/v3/files"
    params = {
        "q": f"'{folder_id}' in parents and trashed = false",
        "fields": "files(id, name, mimeType)",
        "key": api_key,
        "pageSize": 1000,
        "supportsAllDrives": True,
        "includeItemsFromAllDrives": True,
    }
    resp = requests.get(url, params=params, timeout=30)
    print(f"    API status  : {resp.status_code}")

    if resp.status_code != 200:
        print(f"    API error   : {resp.text}")
        return []

    data = resp.json()
    all_files = data.get("files", [])
    print(f"    Total files : {len(all_files)}")
    for f in all_files:
        print(f"      - {f['name']} ({f['mimeType']})")

    return [f for f in all_files if f.get("mimeType") in IMAGE_MIME_TYPES]


def download_file(file_id: str, dest_path: str, api_key: str) -> bool:
    """Download a single Drive file by ID."""
    url = f"https://www.googleapis.com/drive/v3/files/{file_id}"
    params = {"alt": "media", "key": api_key}
    session = requests.Session()
    resp = session.get(url, params=params, stream=True, timeout=60)

    if resp.status_code != 200:
        print(f"      Download error: {resp.status_code} {resp.text[:200]}")
        return False

    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=32768):
            f.write(chunk)
    return True


def main():
    print("🖼️   Starting Google Drive image sync…")
    print(f"    Folder ID : {FOLDER_ID}")
    print(f"    Output    : {OUTPUT_DIR}/")
    print(f"    API Key   : {'set' if API_KEY else 'NOT SET'}")

    if not API_KEY:
        print("  ❌  GOOGLE_API_KEY secret is not set.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("\n  Fetching file list…")
    try:
        files = get_file_list(FOLDER_ID, API_KEY)
    except Exception as e:
        print(f"  ❌  Could not fetch folder listing: {e}")
        return

    if not files:
        print("  ⚠️  No image files found in folder.")
        return

    print(f"\n  {len(files)} image(s) to download\n")

    downloaded = 0
    skipped    = 0

    for f in files:
        dest = os.path.join(OUTPUT_DIR, f["name"])

        if os.path.exists(dest):
            print(f"  ⏭  Skipped (exists): {f['name']}")
            skipped += 1
            continue

        print(f"  ↓  {f['name']} …", end=" ", flush=True)
        ok = download_file(f["id"], dest, API_KEY)
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
