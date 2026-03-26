import json

# Add a mock TIFF dataset to datasets.json for testing if it doesn't exist
with open('public/data/datasets.json', 'r') as f:
    datasets = json.load(f)

# Check if mock dataset exists
mock_id = 'test-geotiff-dataset'
if not any(d['id'] == mock_id for d in datasets):
    mock_dataset = {
        "id": mock_id,
        "title": "Mock GeoTIFF Dataset",
        "description": "A test dataset for GeoTIFF rendering.",
        "category": "Environment",
        "lastUpdated": "2024-03-01",
        "format": "Mixed",
        "size": "10MB",
        "source": "Mock Source",
        "imageUrl": "/images/dataset-placeholder.jpg",
        "viewerType": "leaflet",
        "geojsonUrl": "https://opendata.digitalglobe.com/events/mauritius-oil-spill/post-event/2020-08-12/105001001F1B5B00/105001001F1B5B00.tif"
    }
    datasets.append(mock_dataset)
    with open('public/data/datasets.json', 'w') as f:
        json.dump(datasets, f, indent=2)
    print("Mock dataset added.")
else:
    print("Mock dataset already exists.")
