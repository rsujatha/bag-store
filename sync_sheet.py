"""
sync_sheet.py
Downloads a publicly-shared Google Sheet (no API key required).
Also writes public/catalog.json for the React frontend.
"""

import os
import io
import json
import requests
import pandas as pd

SHEET_ID   = os.environ.get("SHEET_ID", "19y4Goolws3QoInCJxxjVv_2gzkvi9SbHOjBxZ808DGs")
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "data")
FORMAT     = os.environ.get("OUTPUT_FORMAT", "both")
SHEET_GID  = "34655845"


def export_url(sheet_id: str, gid: str = "0") -> str:
    return (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/export?format=csv&gid={gid}"
    )


def fix_image_urls(val: str) -> list[str]:
    """
    Takes a raw image_url cell value (possibly comma-separated filenames)
    and returns a list of proper /images/filename.jpg paths.
    """
    if not val or str(val).strip() == "":
        return []
    parts = [p.strip() for p in str(val).split(",") if p.strip()]
    result = []
    for p in parts:
        if not p.startswith("/"):
            p = f"/images/{p}"
        result.append(p)
    return result


def main():
    print("🔄  Starting Google Sheets sync…")
    print(f"    Sheet ID : {SHEET_ID}")
    print(f"    Output   : {OUTPUT_DIR}/ ({FORMAT})")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    tabs = [{"title": "Sheet1", "gid": SHEET_GID}]
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

    # ── Write public/catalog.json ─────────────────────────────────────────
    if all_dfs:
        df = list(all_dfs.values())[0]
        df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]
        df = df.fillna("")

        if "in_stock" in df.columns:
            df["in_stock"] = df["in_stock"].apply(
                lambda x: str(x).strip().upper() in ("TRUE", "YES", "1", "Y")
            )

        if "price" in df.columns:
            df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0)

        # Convert image_url string → list of /images/... paths
        if "image_url" in df.columns:
            df["images"] = df["image_url"].apply(fix_image_urls)
            df = df.drop(columns=["image_url"])

        products = df.to_dict(orient="records")

        catalog_path = os.path.join("public", "catalog.json")
        os.makedirs("public", exist_ok=True)
        with open(catalog_path, "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print(f"\n  → Wrote {len(products)} products to {catalog_path}")

    print("\n✅  Sync complete!")


if __name__ == "__main__":
    main()
