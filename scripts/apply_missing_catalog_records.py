import json
import os

def apply_records():
    print("Applying missing catalog records to datasets.json...")
    
    catalog_path = '../Guynode_v2-main/Guynode_v2-main/public/data/datasets.json'
    candidates_path = 'missing_catalog_record_candidates.json'
    
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    with open(candidates_path, 'r', encoding='utf-8') as f:
        candidates = json.load(f)
        
    # Prevent appending duplicates if run multiple times
    existing_ids = {d['id'] for d in catalog}
    
    added_count = 0
    for cand in candidates:
        if cand['id'] not in existing_ids:
            catalog.append(cand)
            added_count += 1
            existing_ids.add(cand['id'])
            
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2)
        
    print(f"Appended {added_count} new records to datasets.json.")

if __name__ == "__main__":
    apply_records()
