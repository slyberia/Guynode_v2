import pandas as pd
import json
import os

def map_gcs_urls():
    print("Mapping legacy URLs to GCS bucket URLs...")
    
    # Load downloaded inventory
    df = pd.read_csv("c:/MORE AI STUFF/GUYNODE EXPANSION PACK/ANTIGRAVITY ACTIVATE/BULK DOWNLOADS/downloaded_asset_inventory.csv")
    
    # Create mapping: url -> GCS URL
    url_mapping = {}
    for _, row in df.iterrows():
        legacy_url = row['url']
        # Replace backslashes with forward slashes for URL
        local_path = row['local_path'].replace("\\", "/")
        gcs_url = f"https://storage.googleapis.com/guynode-public-assets/spatial-data/{local_path}"
        url_mapping[legacy_url] = gcs_url
        
    # Load datasets.json
    datasets_path = "c:/MORE AI STUFF/GUYNODE EXPANSION PACK/ANTIGRAVITY ACTIVATE/Guynode_v2-main/Guynode_v2-main/public/data/datasets.json"
    with open(datasets_path, 'r', encoding='utf-8') as f:
        datasets = json.load(f)
        
    replacements = 0
    for ds in datasets:
        if 'distributions' in ds:
            for dist in ds['distributions']:
                if dist['url'] in url_mapping:
                    dist['url'] = url_mapping[dist['url']]
                    replacements += 1
                elif "guynode" in dist['url'] and "storage.googleapis.com" not in dist['url']:
                    print(f"WARNING: Unmapped legacy url: {dist['url']}")
                    
    # Save datasets.json
    with open(datasets_path, 'w', encoding='utf-8') as f:
        json.dump(datasets, f, indent=2)
        
    print(f"Successfully mapped {replacements} URLs to GCS.")

if __name__ == "__main__":
    map_gcs_urls()
