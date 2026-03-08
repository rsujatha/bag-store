"""
sync_sheet.py
Downloads a publicly-shared Google Sheet (no API key required).
Works for any sheet shared as "Anyone with the link can view".
Also writes public/catalog.json for the React frontend.
"""

import os
import io
import re
import json
import requests
import pandas as pd

SHEET_ID   = os.environ.get("SHEET_ID", "19y4Goolws3QoInCJxxjVv_2gzkvi9SbHOjBxZ808DGs")
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "data")
FORMAT     = os.environ.get("OUTPUT_FORMAT", "both")  # csv | xlsx | both
SHEET_GID  = "34655845"   # gid of the google sheet


def export_url(sheet_id: str, gid: str = "0") -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/export?format=csv&gid={gid}"
    )


def main():
    print("🔄  Starting Google Sheets sync…")
    print(f"    Sheet ID : {SHEET_ID}")
    print(f"    Output   : {OUTPUT_DIR}/ ({FORMAT})")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    gid = SHEET_GID
    tabs = [{"title": "Sheet1", "gid": gid}]

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

        # Drop completely empty columns (e.g. trailing comma in header)
        df = df.dropna(axis=1, how="all")
        df.columns = df.columns.str.strip()

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

    # ── Write public/catalog.json for React ──────────────────────────────────
    if all_dfs:
        df = list(all_dfs.values())[0]

        # Normalise column names to lowercase with underscores
        df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]

        # Fill NaN with empty string for JSON safety
        df = df.fillna("")

        # Convert in_stock to boolean
        if "in_stock" in df.columns:
            df["in_stock"] = df["in_stock"].apply(
                lambda x: str(x).strip().upper() in ("TRUE", "YES", "1", "Y")
            )

        # Convert price to float where possible
        if "price" in df.columns:
            df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)

        products = df.to_dict(orient="records")

        catalog_path = os.path.join("public", "catalog.json")
        os.makedirs("public", exist_ok=True)
        with open(catalog_path, "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print(f"\n  → Wrote {len(products)} products to {catalog_path}")

    print("\n✅  Sync complete!")


if __name__ == "__main__":
    main()
