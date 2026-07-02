import json
import pandas as pd
import os

def generate_patch():
    print("Generating catalog provenance patch...")
    
    # Load inputs
    with open('../Guynode_v2-main/Guynode_v2-main/public/data/datasets.json', 'r', encoding='utf-8') as f:
        datasets = json.load(f)
        
    source_rels = pd.read_csv("clean_source_relationships.csv")
    downloaded_assets = pd.read_csv("downloaded_asset_inventory.csv")
    
    # Create lookup dicts
    dataset_by_id = {d['id']: d for d in datasets}
    
    # We will also build a lookup by URL (downloadUrl or inside distributions) to find matches if ID fails
    dataset_by_url = {}
    for d in datasets:
        if d.get('downloadUrl'):
            dataset_by_url[d['downloadUrl']] = d['id']
        for dist in d.get('distributions', []):
            if dist.get('url'):
                dataset_by_url[dist['url']] = d['id']
                
    patch = []
    unmapped_records = []
    
    # Track modifications per dataset ID to combine them
    modifications = {}
    
    # 1. Process Source Relationships
    for _, row in source_rels.iterrows():
        target_id = row['target_item_id']
        url = row['url']
        rel_type = row['relationship_type']
        
        # Determine host/label
        host = str(row['host']) if pd.notna(row['host']) else "External Source"
        
        ds_id = None
        if target_id in dataset_by_id:
            ds_id = target_id
        elif url in dataset_by_url:
            ds_id = dataset_by_url[url]
            
        if not ds_id:
            unmapped_records.append({
                'source_type': 'source_reference',
                'target_id_attempted': target_id,
                'url': url,
                'reason': 'Could not find matching ID or URL in datasets.json'
            })
            continue
            
        if ds_id not in modifications:
            modifications[ds_id] = {'id': ds_id, 'sourceReferences': [], 'distributions': []}
            
        modifications[ds_id]['sourceReferences'].append({
            'label': host,
            'url': url,
            'relationship': rel_type,
            'status': 'needs-review' # default status for new additions
        })
        
    # 2. Process Downloaded Assets
    for _, row in downloaded_assets.iterrows():
        legacy_id = row['legacy_item_id']
        url = row['url']
        sha256 = row['sha256']
        local_path = row['local_path']
        
        ds_id = None
        if legacy_id in dataset_by_id:
            ds_id = legacy_id
        elif url in dataset_by_url:
            ds_id = dataset_by_url[url]
            
        if not ds_id:
            unmapped_records.append({
                'source_type': 'downloaded_asset',
                'target_id_attempted': legacy_id,
                'url': url,
                'reason': 'Could not find matching ID or URL in datasets.json'
            })
            continue
            
        if ds_id not in modifications:
            modifications[ds_id] = {'id': ds_id, 'sourceReferences': [], 'distributions': []}
            
        # Determine format from extension
        ext = os.path.splitext(local_path)[1].upper().replace('.', '')
        
        modifications[ds_id]['distributions'].append({
            'label': f'Legacy Direct Download ({ext})',
            'format': ext,
            'url': url, # Keeping original URL for provenance, or could be a relative path if hosted locally
            'checksum': f'sha256:{sha256}',
            'checksumStatus': 'generated',
            'checksumSource': 'self-sha256',
            'downloadable': True
        })
        
    # Convert modifications to list for patch
    for ds_id, mods in modifications.items():
        patch.append(mods)
        
    # Write Patch JSON
    with open("catalog_provenance_patch.json", "w", encoding='utf-8') as f:
        json.dump(patch, f, indent=2)
        
    # Write Unmapped
    if unmapped_records:
        unmapped_df = pd.DataFrame(unmapped_records)
        unmapped_df.to_csv("catalog_records_needing_manual_review_v2.csv", index=False)
    else:
        pd.DataFrame(columns=['source_type', 'target_id_attempted', 'url', 'reason']).to_csv("catalog_records_needing_manual_review_v2.csv", index=False)
        
    # Write Report
    report_content = f"""# Catalog Provenance Patch Report

## Summary
The patch mapping source references and verified downloads to the catalog schema has been generated.

- **Total Datasets Patched:** {len(patch)}
- **Total Source References Mapped:** {sum(len(m['sourceReferences']) for m in patch)}
- **Total Download Distributions Mapped:** {sum(len(m['distributions']) for m in patch)}
- **Unmapped Records Requiring Review:** {len(unmapped_records)}

## Next Steps
- Review `catalog_records_needing_manual_review.csv` to manually map IDs that didn't match perfectly.
- Review `catalog_provenance_patch.json` before applying it to `datasets.json`.
"""
    with open("catalog_provenance_patch_report.md", "w", encoding='utf-8') as f:
        f.write(report_content)
        
    print("Patch generation complete.")

if __name__ == "__main__":
    generate_patch()
