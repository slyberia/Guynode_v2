import json
import os

def apply_patch():
    print("Applying provenance patch to datasets.json...")
    
    catalog_path = '../Guynode_v2-main/Guynode_v2-main/public/data/datasets.json'
    patch_path = 'catalog_provenance_patch.json'
    
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    with open(patch_path, 'r', encoding='utf-8') as f:
        patch = json.load(f)
        
    # Create lookup for faster patch application
    catalog_by_id = {d['id']: d for d in catalog}
    
    applied_count = 0
    for update in patch:
        ds_id = update['id']
        if ds_id in catalog_by_id:
            dataset = catalog_by_id[ds_id]
            
            # Update distributions
            if 'distributions' not in dataset:
                dataset['distributions'] = []
            
            # Avoid duplicate distributions
            existing_dist_urls = {d.get('url') for d in dataset['distributions']}
            for dist in update.get('distributions', []):
                if dist.get('url') not in existing_dist_urls:
                    # Use public URLs for distributions as requested
                    public_url = dist.get('url')
                    # if it's not an http URL, it's a local path from the CSV. We need to mock a public URL
                    if public_url and not public_url.startswith('http'):
                        filename = os.path.basename(public_url)
                        public_url = f"https://storage.googleapis.com/guynode-public-assets/recovered/{filename}"
                        dist['url'] = public_url
                        
                    dataset['distributions'].append(dist)
                    
            # Update sourceReferences
            if 'sourceReferences' not in dataset:
                dataset['sourceReferences'] = []
                
            # Avoid duplicate source references
            existing_ref_urls = {r.get('url') for r in dataset['sourceReferences']}
            for ref in update.get('sourceReferences', []):
                if ref.get('url') not in existing_ref_urls:
                    dataset['sourceReferences'].append(ref)
                    
            applied_count += 1
            
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2)
        
    print(f"Successfully applied provenance patch to {applied_count} records.")

if __name__ == "__main__":
    apply_patch()
