"""
sync_sheet.py
Downloads a publicly-shared Google Sheet (no API key required).
Works for any sheet shared as "Anyone with the link can view".
"""

import os
import io
import re
import requests
import pandas as pd

SHEET_ID   = os.environ.get("SHEET_ID", "19y4Goolws3QoInCJxxjVv_2gzkvi9SbHOjBxZ808DGs")
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "data")
FORMAT     = os.environ.get("OUTPUT_FORMAT", "both")  # csv | xlsx | both
SHEET_GID: "34655845"   # gid of the google sheet


def export_url(sheet_id: str, gid: str = "0") -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/export?format=csv&gid={gid}"
    )


def fetch_tabs(sheet_id: str) -> list[dict]:
    """
    Discover all worksheet tabs from the sheet's public HTML.
    Falls back to first sheet only if parsing fails.
    """
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    gid_matches  = list(dict.fromkeys(re.findall(r'"gid=(\d+)"', resp.text)))
    name_matches = re.findall(
        r'<span[^>]*class="[^"]*goog-inline-block[^"]*"[^>]*>([^<]+)</span>',
        resp.text
    )

    if not gid_matches:
        return [{"title": "Sheet1", "gid": "0"}]

    return [
        {"title": (name_matches[i].strip() if i < len(name_matches) else f"Sheet{i+1}"),
         "gid": gid}
        for i, gid in enumerate(gid_matches)
    ]


def main():
    print("🔄  Starting Google Sheets sync…")
    print(f"    Sheet ID : {SHEET_ID}")
    print(f"    Output   : {OUTPUT_DIR}/ ({FORMAT})")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    try:
        tabs = fetch_tabs(SHEET_ID)
        print(f"    Tabs     : {[t['title'] for t in tabs]}")
    except Exception as e:
        print(f"    ⚠️  Tab discovery failed ({e}), using first sheet only.")
        tabs = [{"title": "Sheet1", "gid": "0"}]

    all_dfs: dict[str, pd.DataFrame] = {}

    for tab in tabs:
        title, gid = tab["title"], tab["gid"]
        print(f"\n  Fetching '{title}' (gid={gid})…")
        try:
            resp = requests.get(export_url(SHEET_ID, gid), timeout=30)
            resp.raise_for_status()
        except requests.HTTPError as e:
            print(f"    ❌  Skipped ({e})")
            continue

        df = pd.read_csv(io.StringIO(resp.text))
        print(f"    ✓ {len(df)} rows × {len(df.columns)} cols")
        all_dfs[title] = df

        safe = title.replace(" ", "_").replace("/", "-")
        if FORMAT in ("csv", "both"):
            path = os.path.join(OUTPUT_DIR, f"{safe}.csv")
            df.to_csv(path, index=False)
            print(f"    → {path}")
        if FORMAT in ("xlsx", "both"):
            path = os.path.join(OUTPUT_DIR, f"{safe}.xlsx")
            df.to_excel(path, index=False)
            print(f"    → {path}")

    # Combined workbook when there are multiple tabs
    if FORMAT in ("xlsx", "both") and len(all_dfs) > 1:
        combined = os.path.join(OUTPUT_DIR, "all_tabs.xlsx")
        with pd.ExcelWriter(combined, engine="openpyxl") as writer:
            for name, df in all_dfs.items():
                df.to_excel(writer, sheet_name=name[:31], index=False)
        print(f"\n  → Combined workbook: {combined}")

    print("\n✅  Sync complete!")


if __name__ == "__main__":
    main()
