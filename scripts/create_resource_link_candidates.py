import pandas as pd
import json
from urllib.parse import urlparse

def generate_resource_candidates():
    print("Generating resource link candidates...")
    
    # 1. Load relationships
    rel_df = pd.read_csv("c:/MORE AI STUFF/GUYNODE EXPANSION PACK/ANTIGRAVITY ACTIVATE/BULK DOWNLOADS/clean_source_relationships.csv")
    
    # 2. Group by URL
    grouped = rel_df.groupby('url')['target_item_id'].apply(lambda x: list(set(x.dropna()))).reset_index()
    
    candidates = []
    
    for _, row in grouped.iterrows():
        url = row['url']
        related_ids = row['target_item_id']
        
        url_lower = url.lower()
        
        # Heuristic Title
        title = "External Resource"
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '')
        
        if 'arcgis.com/apps' in url_lower:
            title = "Interactive Web Map (ArcGIS)"
        elif 'dwtkns.com/srtm30m' in url_lower:
            title = "30-Meter SRTM Tile Downloader"
        elif 'earthdata' in url_lower:
            title = "NASA EarthData Search Portal"
        elif 'copernicus' in url_lower:
            title = "Copernicus Open Access Hub"
        elif 'shop.geospatial.com' in url_lower:
            title = "Guyana Topographic Maps (Commercial)"
        elif 'gadm.org' in url_lower:
            title = "GADM Data Download Portal"
        elif 'nationalmap.gov' in url_lower:
            title = "USGS National Map Downloader"
        else:
            title = f"External Resource on {domain}"
            
        # Determine resourceType
        if 'arcgis.com/apps' in url_lower:
            r_type = 'web-map-app'
        elif 'earthdata' in url_lower or 'copernicus' in url_lower or 'usgs.gov' in url_lower or 'dwtkns.com' in url_lower or 'gadm.org' in url_lower:
            r_type = 'data-portal'
        elif 'drive.google.com' in url_lower:
            r_type = 'manual-review'
        elif 'shop.geospatial' in url_lower:
            r_type = 'commercial-reference'
        elif 'tutorial' in url_lower or 'learn' in url_lower:
            r_type = 'tutorial'
        else:
            r_type = 'source-reference'
            
        cand = {
            "id": f"res-{abs(hash(url)) % 1000000}",
            "title": title,
            "resourceType": r_type,
            "url": url,
            "description": f"External resource or data portal referenced by legacy Guynode.",
            "relatedDatasets": related_ids,
            "status": "external",
            "migrationDecision": "moved-to-resources"
        }
        candidates.append(cand)
        
    with open('resource_link_candidates.json', 'w', encoding='utf-8') as f:
        json.dump(candidates, f, indent=2)
        
    print(f"Generated {len(candidates)} resource link candidates.")

if __name__ == "__main__":
    generate_resource_candidates()
