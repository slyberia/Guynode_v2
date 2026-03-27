"""
convert-and-upload.py — Shapefile → GeoJSON conversion and GCS upload for Guynode datasets.

Usage:
    python scripts/convert-and-upload.py \\
        --assets-dir /path/to/local/shapefiles \\
        [--dry-run] \\
        [--skip-existing] \\
        [--update-json]

Requirements:
    - gdal (ogr2ogr must be on PATH)
    - gsutil (Google Cloud SDK must be on PATH and authenticated)
    - Python 3.8+

Recommended workflow:
    1. Dry run first to verify paths and check for missing files:
           python scripts/convert-and-upload.py --assets-dir ./shapefiles --dry-run
    2. Full run to convert and upload all shapefiles:
           python scripts/convert-and-upload.py --assets-dir ./shapefiles --skip-existing
    3. Optionally update datasets.json to flip viewerType to "leaflet":
           python scripts/convert-and-upload.py --assets-dir ./shapefiles --update-json
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlparse

# ─────────────────────────────────────────────────────────────────────────────
# Filename map: dataset ID → local zip filename in --assets-dir
# ─────────────────────────────────────────────────────────────────────────────
FILENAME_MAP = {
    "all-ndcs": "All_NDCs.zip",
    "amerindian-areas": "Amerindian Areas.zip",
    "anna-regina-boundary": "Anna_Regina.zip",
    "corriverton-constituencies": "Corriverton.zip",
    "georgetown-constituencies": "Georgetown Constituencies.zip",
    "georgetown-census-districts": "Georgetown_Districts.zip",
    "guyana-national-boundary": "Guyana.zip",
    "lethem-constituencies": "LethemConstituencies.zip",
    "linden-census-districts": "Linden_Census_Districts.zip",
    "local-government-areas": "Local_Govt_Areas_Guyana.zip",
    "mabaruma-constituencies": "Maburama_Constituencies.zip",
    "mahdia-boundary": "Mahdia.zip",
    "guyana-exclusive-economic-zone": "Maritime Boundary.zip",
    "bartica-municipality": "Municipality of Bartica.zip",
    "new-amsterdam-census-districts": "New_Amsterdam_Census_Districts.zip",
    "region-10-ndcs": "Region10_NDCs.zip",
    "region-1-ndcs": "Region1_NDCs.zip",
    "region-2-ndcs": "Region2_NDCs.zip",
    "region-3-ndcs": "Region3_NDCs.zip",
    "region-4-ndcs": "Region4_NDCs.zip",
    "region-5-villages": "Region5Villages.zip",
    "region-5-ndcs": "Region5_NDCs.zip",
    "region-6-ndcs": "Region6_NDCs.zip",
    "region-7-ndcs": "Region7_NDCs.zip",
    "region-8-ndcs": "Region8_NDCs.zip",
    "region-9-ndcs": "Region9_NDCs.zip",
    "region-9-boundary": "Region_Nine_Boundary.zip",
    "region-1-boundary": "Region_One_Guyana.zip",
    "rose-hall-constituencies": "Rosehall.zip",
    "silica-city-boundary": "Silica City.zip",
    "linden-town-constituencies": "Town of Linden_Constituencies.zip",
    "guyana-admin-regions-population": "guyana_admin_regions_population.zip",
}


def check_dependency(name: str) -> None:
    """Exit with a clear message if a required CLI tool is not on PATH."""
    if not shutil.which(name):
        print(f"ERROR: '{name}' is not installed or not on PATH.", file=sys.stderr)
        print(f"       Install it and ensure it is accessible before running this script.", file=sys.stderr)
        sys.exit(1)


def derive_gcs_geojson_path(download_url: str) -> str:
    """
    Derive the GCS target path for a GeoJSON file from a shapefile downloadUrl.
    Replaces /shapefile/ with /geojson/ and .zip with .geojson, then URL-decodes.
    """
    path = unquote(download_url)
    path = path.replace("/shapefile/", "/geojson/")
    path = path.replace(".zip", ".geojson")
    # Strip the gs:// or https://storage.googleapis.com/ prefix to get the GCS path
    return path


def to_gcs_uri(url: str) -> str:
    """Convert a storage.googleapis.com HTTPS URL to a gs:// URI for gsutil."""
    if url.startswith("gs://"):
        return url
    parsed = urlparse(url)
    # https://storage.googleapis.com/BUCKET/path/to/file
    # → gs://BUCKET/path/to/file
    parts = parsed.path.lstrip("/").split("/", 1)
    if len(parts) == 2:
        bucket, obj_path = parts
        return f"gs://{bucket}/{obj_path}"
    return url


def gcs_file_exists(gcs_uri: str) -> bool:
    """Return True if the file already exists in GCS."""
    result = subprocess.run(
        ["gsutil", "-q", "stat", gcs_uri],
        capture_output=True,
    )
    return result.returncode == 0


def convert_shapefile(zip_path: str, out_geojson: str, dry_run: bool) -> bool:
    """
    Convert a shapefile zip to GeoJSON using ogr2ogr with /vsizip/ driver.
    Returns True on success.
    """
    cmd = [
        "ogr2ogr",
        "-f", "GeoJSON",
        "-t_srs", "EPSG:4326",
        "-lco", "RFC7946=YES",
        out_geojson,
        f"/vsizip/{zip_path}",
    ]
    print(f"    [convert] {' '.join(cmd)}")
    if dry_run:
        return True
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"    ERROR (ogr2ogr): {result.stderr.strip()}", file=sys.stderr)
        return False
    return True


def upload_geojson(local_path: str, gcs_uri: str, dry_run: bool) -> bool:
    """Upload a GeoJSON file to GCS with the correct Content-Type. Returns True on success."""
    cmd = [
        "gsutil",
        "-h", "Content-Type:application/geo+json",
        "cp",
        local_path,
        gcs_uri,
    ]
    print(f"    [upload]  {' '.join(cmd)}")
    if dry_run:
        return True
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"    ERROR (gsutil): {result.stderr.strip()}", file=sys.stderr)
        return False
    return True


def update_datasets_json(
    datasets_path: str,
    successful_uploads: dict[str, str],
) -> None:
    """
    For each successfully uploaded dataset, set viewerType='leaflet' and
    geojsonUrl to the decoded HTTPS URL of the uploaded GeoJSON.
    """
    with open(datasets_path) as f:
        datasets = json.load(f)

    updated = 0
    for d in datasets:
        if d["id"] in successful_uploads:
            geojson_url = successful_uploads[d["id"]]
            d["viewerType"] = "leaflet"
            d["geojsonUrl"] = geojson_url
            updated += 1

    with open(datasets_path, "w") as f:
        json.dump(datasets, f, indent=2)

    print(f"\n✅ Updated datasets.json: {updated} entries patched.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert Guyana shapefiles to GeoJSON and upload to GCS.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--assets-dir",
        required=True,
        help="Local folder containing shapefile zip files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print all actions without executing conversions or uploads.",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Skip datasets whose GeoJSON already exists in GCS (default: True).",
    )
    parser.add_argument(
        "--update-json",
        action="store_true",
        help="Update public/data/datasets.json after successful uploads.",
    )
    args = parser.parse_args()

    check_dependency("ogr2ogr")
    check_dependency("gsutil")

    assets_dir = os.path.abspath(args.assets_dir)
    if not os.path.isdir(assets_dir):
        print(f"ERROR: --assets-dir '{assets_dir}' is not a directory.", file=sys.stderr)
        sys.exit(1)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_path = os.path.join(script_dir, "..", "public", "data", "datasets.json")
    datasets_path = os.path.normpath(datasets_path)

    with open(datasets_path) as f:
        datasets = json.load(f)

    # Build lookup: id → dataset entry
    dataset_map = {d["id"]: d for d in datasets}

    counts = {"success": 0, "skipped": 0, "failed": 0, "missing": 0}
    failed_ids: list[str] = []
    missing_ids: list[str] = []
    successful_uploads: dict[str, str] = {}  # id → decoded GeoJSON URL

    if args.dry_run:
        print("⚡ DRY RUN — no files will be written or uploaded.\n")

    for dataset_id, zip_filename in FILENAME_MAP.items():
        print(f"\n[{dataset_id}]")

        # Check dataset is in datasets.json
        if dataset_id not in dataset_map:
            print(f"  SKIP: not found in datasets.json")
            counts["skipped"] += 1
            continue

        dataset = dataset_map[dataset_id]
        download_url = dataset.get("downloadUrl", "")
        if not download_url:
            print(f"  SKIP: no downloadUrl in datasets.json")
            counts["skipped"] += 1
            continue

        # Derive GCS target
        geojson_url = derive_gcs_geojson_path(download_url)
        gcs_uri = to_gcs_uri(geojson_url)

        # Check local zip exists
        zip_path = os.path.join(assets_dir, zip_filename)
        if not os.path.isfile(zip_path):
            print(f"  MISSING local file: {zip_filename}")
            counts["missing"] += 1
            missing_ids.append(dataset_id)
            continue

        # Skip if already uploaded
        if args.skip_existing and not args.dry_run:
            if gcs_file_exists(gcs_uri):
                print(f"  SKIPPED (already in GCS): {gcs_uri}")
                counts["skipped"] += 1
                continue

        # Convert + upload via temp dir
        with tempfile.TemporaryDirectory() as tmpdir:
            out_geojson = os.path.join(tmpdir, f"{dataset_id}.geojson")

            ok = convert_shapefile(zip_path, out_geojson, args.dry_run)
            if not ok:
                counts["failed"] += 1
                failed_ids.append(dataset_id)
                continue

            ok = upload_geojson(out_geojson, gcs_uri, args.dry_run)
            if not ok:
                counts["failed"] += 1
                failed_ids.append(dataset_id)
                continue

        counts["success"] += 1
        # Store the decoded HTTPS URL (for datasets.json update)
        successful_uploads[dataset_id] = geojson_url

    # Summary
    print("\n" + "─" * 60)
    print("SUMMARY")
    print(f"  Successful uploads : {counts['success']}")
    print(f"  Skipped            : {counts['skipped']}")
    print(f"  Failed             : {counts['failed']}")
    print(f"  Missing local file : {counts['missing']}")

    if failed_ids:
        print(f"\nFailed IDs: {', '.join(failed_ids)}")
    if missing_ids:
        print(f"Missing IDs: {', '.join(missing_ids)}")

    if args.update_json and successful_uploads:
        update_datasets_json(datasets_path, successful_uploads)
    elif args.update_json and not successful_uploads:
        print("\n(--update-json: no successful uploads to apply)")


if __name__ == "__main__":
    main()
