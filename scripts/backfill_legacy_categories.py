import pandas as pd
import json

def backfill():
    print("Backfilling legacyHomepageCategory in datasets.json...")
    
    # Load mapping
    df = pd.read_csv("c:/MORE AI STUFF/GUYNODE EXPANSION PACK/ANTIGRAVITY ACTIVATE/ANALYZING THE MISSING DATA/guynode_phase5b_pt1_catalog_comparison_refined.csv")
    
    # Create dict from matched_new_catalog_id -> homepage_category
    mapping = {}
    for _, row in df.dropna(subset=['matched_new_catalog_id', 'homepage_category']).iterrows():
        # some rows have multiple comma separated ids, but usually just one
        ids = str(row['matched_new_catalog_id']).split(',')
        for i in ids:
            mapping[i.strip()] = str(row['homepage_category']).strip()
            
    # Also create a mapping for the newly generated records (their ID is legacy-xxx)
    for _, row in df.dropna(subset=['legacy_item_id', 'homepage_category']).iterrows():
        mapping[str(row['legacy_item_id']).strip()] = str(row['homepage_category']).strip()
        
    fallback_map = {
        'Administrative Boundaries': 'Administrative Boundaries',
        'Reference': 'Administrative Boundaries', # Often context docs from admin page
        'Planning and Development': 'Infrastructure',
        'Socio-Economic Layers': 'Socio-Economic Layers',
        'DEMs, Imagery & Topo Maps': 'DEMs, Imagery & Topo Maps',
        'Demographics': 'Socio-Economic Layers',
        'Infrastructure': 'Infrastructure'
    }
    
    catalog_path = "c:/MORE AI STUFF/GUYNODE EXPANSION PACK/ANTIGRAVITY ACTIVATE/Guynode_v2-main/Guynode_v2-main/public/data/datasets.json"
    with open(catalog_path, 'r', encoding='utf-8') as f:
        datasets = json.load(f)
        
    updated = 0
    for d in datasets:
        ds_id = d['id']
        cat = d.get('category', '')
        
        legacy_cat = None
        if ds_id in mapping:
            legacy_cat = mapping[ds_id]
        elif cat in fallback_map:
            legacy_cat = fallback_map[cat]
        else:
            legacy_cat = cat # Keep as is if no fallback
            
        d['legacyHomepageCategory'] = legacy_cat
        updated += 1
        
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(datasets, f, indent=2)
        
    print(f"Backfilled legacyHomepageCategory for {updated} records.")

if __name__ == "__main__":
    backfill()
