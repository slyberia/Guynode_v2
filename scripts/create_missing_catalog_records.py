import pandas as pd
import json
import re
import os
import zipfile
from datetime import datetime

def make_slug(text):
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

def inspect_zip_for_format(zip_path):
    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            namelist = z.namelist()
            exts = [os.path.splitext(n)[1].lower() for n in namelist]
            if '.shp' in exts:
                return 'Shapefile'
            if '.tif' in exts or '.tiff' in exts or '.hgt' in exts:
                return 'GeoTIFF'
            if '.pdf' in exts:
                return 'PDF'
            if '.xls' in exts or '.xlsx' in exts or '.csv' in exts:
                return 'Spreadsheet'
            if '.geojson' in exts:
                return 'GeoJSON'
    except Exception:
        pass
    return None

def infer_format(local_paths):
    formats = set()
    for p in local_paths:
        ext = os.path.splitext(p)[1].upper().replace('.', '')
        if ext == 'ZIP':
            if os.path.exists(p):
                detected = inspect_zip_for_format(p)
                if detected:
                    formats.add(detected)
                else:
                    formats.add('Mixed')
            else:
                formats.add('Mixed')
        elif ext in ['TIF', 'TIFF']:
            formats.add('GeoTIFF')
        elif ext in ['XLS', 'XLSX', 'CSV']:
            formats.add('Spreadsheet')
        elif ext == 'PDF':
            formats.add('PDF')
        elif ext == 'SHP':
            formats.add('Shapefile')
        elif ext == 'GEOJSON':
            formats.add('GeoJSON')
        elif ext in ['PNG', 'JPG', 'JPEG']:
            formats.add('Image')
        else:
            formats.add('Mixed')
            
    if not formats:
        return "Mixed"
    if len(formats) > 1:
        return "Mixed"
    return list(formats)[0]

def create_records():
    print("Generating schema-safe candidate catalog records...")
    
    downloaded_df = pd.read_csv("downloaded_asset_inventory.csv")
    legacy_meta_df = pd.read_csv("../ANALYZING THE MISSING DATA/legacy_guynode_pt1_individual_item_inventory.csv")
    
    # We only create records for IDs that have actual downloaded assets
    unique_items = downloaded_df['legacy_item_id'].unique()
    
    candidates = []
    
    for legacy_id in unique_items:
        item_downloads = downloaded_df[downloaded_df['legacy_item_id'] == legacy_id]
        title = item_downloads.iloc[0]['legacy_item_title']
        
        # 1. Deduplicate/fix specific known issues
        if legacy_id == 'legacy-demtopo-008' and title == 'Region 7, SRTM 30m Elevation Data':
            title = 'Region 7, SRTM 30m Elevation Data (Tile 2)'
        
        # 2. Rename legacy-demtopo-016
        if legacy_id == 'legacy-demtopo-016':
            title = 'NASADEM / Reprocessed SRTM DEM'
            
        # 3. Infer format (schema safe)
        dataset_format = infer_format(item_downloads['local_path'].tolist())
        
        # Try to find metadata
        meta_row = legacy_meta_df[legacy_meta_df['legacy_item_id'] == legacy_id]
        
        description = "Legacy data asset recovered from Guynode archive."
        if legacy_id == 'legacy-demtopo-016':
            description = "Reprocessed SRTM DEMs with improved accuracy and fewer voids. Good replacement for legacy SRTM in regional studies and for comparison with Copernicus DEM."
            
        category = "Reference"
        source = "Legacy Guynode Archive"
        
        if not meta_row.empty:
            meta = meta_row.iloc[0]
            if pd.notna(meta['description_evidence']):
                description = str(meta['description_evidence'])
            if pd.notna(meta['homepage_category']):
                category = str(meta['homepage_category'])
            if pd.notna(meta['source_text_extracted']):
                source = str(meta['source_text_extracted'])
        else:
            if 'demtopo' in legacy_id:
                category = "DEMs, Imagery & Topo Maps"
            elif 'admin' in legacy_id:
                category = "Administrative Boundaries"
            elif 'socio' in legacy_id:
                category = "Demographics"
            elif 'infra' in legacy_id:
                category = "Planning and Development"
                
        catalog_id = legacy_id
        
        dataset = {
            "id": catalog_id,
            "title": title,
            "description": description,
            "category": category,
            "lastUpdated": "2019-01-01T00:00:00Z", 
            "format": dataset_format,
            "size": "Unknown",
            "source": source,
            "imageUrl": "/images/dataset-placeholder.jpg",
            "ingestionStatus": "PENDING", 
            "validationReport": {
                "status": "UNCHECKED",
                "issues": ["Legacy asset recovered via automated pipeline", "Needs manual review of metadata accuracy"],
                "timestamp": datetime.now().strftime("%Y-%m-%dT00:00:00Z")
            },
            "lastVerified": datetime.now().strftime("%Y-%m-%d"),
            "distributions": [],
            "sourceReferences": [],
            "tags": ["legacy-recovered"]
        }
        candidates.append(dataset)
        
    with open("missing_catalog_record_candidates.json", "w", encoding='utf-8') as f:
        json.dump(candidates, f, indent=2)
        
    print(f"Generated {len(candidates)} schema-safe candidate records.")

if __name__ == "__main__":
    create_records()
